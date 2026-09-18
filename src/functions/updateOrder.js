const { app, output } = require('@azure/functions');

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

        if (request.method === 'OPTIONS') {
            return { status: 200, headers: corsHeaders };
        }

        try {
            let body = {};
            try {
                body = await request.json();
            } catch (e) {
                const rawText = await request.text();
                body = rawText ? JSON.parse(rawText) : {};
            }

            const { orderId, status, customerName, dish, amount, createdAt } = body;

            if (!orderId) {
                return {
                    status: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ error: 'Thiếu orderId' })
                };
            }

            const updatedOrder = {
                id: orderId,
                customerName: customerName || 'Khách hàng',
                dish: dish || 'Phở Bò Tái',
                amount: amount || 45000,
                status: status || 'Completed',
                paymentStatus: 'Paid',
                createdAt: createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // 1. Lưu trạng thái Completed vào Cosmos DB
            context.extraOutputs.set(cosmosOutput, updatedOrder);

            // 2. Gửi thông báo Hoàn Thành về Discord
            try {
                await fetch(DISCORD_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        embeds: [{
                            title: "✅ MÓN ĂN ĐÃ HOÀN THÀNH & GIAO MÓN!",
                            color: 5763719, // Màu xanh lá
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
                context.log(`Lỗi gửi Discord Webhook: ${discordErr.message}`);
            }

            return {
                status: 200,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Cập nhật thành công', order: updatedOrder })
            };
        } catch (error) {
            return {
                status: 500,
                headers: corsHeaders,
                body: JSON.stringify({ error: error.message })
            };
        }
    }
});