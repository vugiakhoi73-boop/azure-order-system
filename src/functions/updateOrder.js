const { app, output } = require('@azure/functions');

// Lưu ý: Đưa link Discord vào biến môi trường trên Azure sẽ an toàn hơn là để lộ trong code
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1550352917939363973/055wetTpsyndZbRZ06RRLfE8pmYqVdCQW2fWxVDl9eiH7ORI5O9NSWugRFs-ZOPIHzwZ";

const cosmosOutput = output.cosmosDB({
    databaseName: 'OrderDB',
    containerName: 'Orders',
    connection: 'CosmosDBConnectionString'
});

app.http('UpdateOrder', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    extraOutputs: [cosmosOutput],
    handler: async (request, context) => {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
        };

        if (request.method === 'OPTIONS') return { status: 200, headers: corsHeaders };

        try {
            const body = await request.json();
            
            // Lấy ID chuẩn xác từ giao diện
            const orderId = body.id || body.orderId; 

            if (!orderId) {
                return { status: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Thiếu mã đơn hàng' }) };
            }

            // Lắp ráp lại toàn bộ dữ liệu để tránh Cosmos DB ghi đè mất thông tin cũ
            const updatedOrder = {
                id: orderId,
                customerName: body.customerName || 'Khách hàng',
                customerPhone: body.customerPhone || 'Không có',
                customerAddress: body.customerAddress || 'Không có',
                dish: body.dish || 'Phở Bò Tái',
                amount: body.amount || 45000,
                status: 'Completed',
                paymentStatus: 'Paid',
                createdAt: body.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // 1. Lưu trạng thái vào Cosmos DB
            context.extraOutputs.set(cosmosOutput, updatedOrder);

            // 2. Bắn thông báo hoàn thành qua Discord
            try {
                await fetch(DISCORD_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        embeds: [{
                            title: "✅ MÓN ĂN ĐÃ HOÀN THÀNH & GIAO MÓN!",
                            color: 5763719,
                            fields: [
                                { name: "Mã đơn", value: updatedOrder.id, inline: true },
                                { name: "Khách hàng", value: updatedOrder.customerName, inline: true },
                                { name: "Món ăn", value: updatedOrder.dish, inline: true },
                                { name: "Trạng thái", value: "Đã xong (Đã giao)", inline: true }
                            ],
                            timestamp: updatedOrder.updatedAt
                        }]
                    })
                });
            } catch (discordErr) {
                context.log(`Lỗi Discord: ${discordErr.message}`);
            }

            return { status: 200, headers: corsHeaders, body: JSON.stringify({ message: 'Cập nhật thành công', order: updatedOrder }) };
        } catch (error) {
            return { status: 500, headers: corsHeaders, body: JSON.stringify({ error: error.message }) };
        }
    }
});