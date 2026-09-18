const { app } = require('@azure/functions');
const axios = require('axios');

app.cosmosDB('ProcessAlert', {
    databaseName: 'OrderDB',
    containerName: 'Orders',
    connection: 'CosmosDBConnectionString',
    createLeaseContainerIfNotExists: true,
    handler: async (documents, context) => {
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

        if (!webhookUrl) {
            context.error('Thiếu cấu hình DISCORD_WEBHOOK_URL!');
            return;
        }

        for (const doc of documents) {
            const payload = {
                username: "Azure Order System",
                avatar_url: "https://portal.azure.com/favicon.ico",
                embeds: [
                    {
                        title: "🛒 CÓ ĐƠN HÀNG MỚI!",
                        color: 5814783,
                        fields: [
                            { name: "Mã đơn hàng", value: doc.id, inline: true },
                            { name: "Khách hàng", value: doc.customerName, inline: true },
                            { name: "Sản phẩm", value: doc.item, inline: true },
                            { name: "Giá tiền", value: `${doc.price.toLocaleString('vi-VN')} VNĐ`, inline: true },
                            { name: "Thời gian", value: doc.createdAt, inline: false }
                        ],
                        footer: { text: "Serverless Event-Driven via Cosmos DB Change Feed" }
                    }
                ]
            };

            try {
                await axios.post(webhookUrl, payload);
                context.log(`Đã gửi thông báo Discord cho đơn hàng: ${doc.id}`);
            } catch (err) {
                context.error(`Lỗi gửi Webhook Discord (${doc.id}):`, err.message);
            }
        }
    }
});