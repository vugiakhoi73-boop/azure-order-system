const { app, output } = require('@azure/functions');

// Dán URL Webhook Discord của bạn tại đây
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1550352917939363973/055wetTpsyndZbRZ06RRLfE8pmYqVdCQW2fWxVDl9eiH7ORI5O9NSWugRFs-ZOPIHzwZ";

const cosmosOutput = output.cosmosDB({
    databaseName: 'OrderDB',
    containerName: 'Orders',
    connection: 'CosmosDBConnectionString'
});

app.http('CreateOrder', {
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

            const newOrder = {
                id: Date.now().toString(),
                customerName: body.customerName || 'Khách hàng',
                dish: body.dish || 'Phở Bò Tái',
                amount: Number(body.amount) || Number(body.price) || 45000,
                status: 'Pending',
                paymentStatus: 'Paid',
                createdAt: new Date().toISOString()
            };

            // 1. Lưu vào Cosmos DB
            context.extraOutputs.set(cosmosOutput, newOrder);

            // 2. Gửi thông báo đến kênh Discord
            try {
                await fetch(DISCORD_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        embeds: [{
                            title: "🍜 CÓ ĐƠN HÀNG MỚI!",
                            color: 15158332,
                            fields: [
                                { name: "Mã đơn", value: newOrder.id, inline: true },
                                { name: "Khách hàng", value: newOrder.customerName, inline: true },
                                { name: "Món ăn", value: newOrder.dish, inline: true },
                                { name: "Thành tiền", value: `${newOrder.amount.toLocaleString('vi-VN')} VNĐ`, inline: true }
                            ],
                            timestamp: newOrder.createdAt
                        }]
                    })
                });
            } catch (discordErr) {
                context.log(`Lỗi gửi Discord Webhook: ${discordErr.message}`);
            }

            return {
                status: 201,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Tạo đơn thành công!', order: newOrder })
            };
        } catch (error) {
            return {
                status: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: error.message })
            };
        }
    }
});