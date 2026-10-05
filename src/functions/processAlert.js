const { app } = require('@azure/functions');

// Chèn link Discord Webhook trực tiếp
const webhookUrl = "https://discord.com/api/webhooks/1550352917939363973/055wetTpsyndZbRZ06RRLfE8pmYqVdCQW2fWxVDl9eiH7ORI5O9NSWugRFs-ZOPIHzwZ";

app.cosmosDB('ProcessAlert', {
    connection: 'CosmosDBConnectionString',
    databaseName: 'OrderDB',
    containerName: 'Orders',
    createLeaseContainerIfNotExists: true,
    handler: async (documents, context) => {
        if (!!documents && documents.length > 0) {
            for (let order of documents) {
                // Chỉ gửi thông báo khi có đơn ở trạng thái Pending
                if (order.status === 'Pending') {
                    const phone = order.customerPhone ? order.customerPhone : 'Không có';
                    const address = order.customerAddress ? order.customerAddress : 'Không có';

                    // Chuyển sang định dạng Embed có khung của Discord
                    const discordMessage = {
                        embeds: [{
                            title: "🍜 CÓ ĐƠN HÀNG MỚI",
                            color: 15105570, // Màu cam nhạt báo hiệu đơn mới
                            fields: [
                                { name: "Mã đơn", value: order.id, inline: true },
                                { name: "Khách hàng", value: order.customerName, inline: true },
                                { name: "Số điện thoại", value: phone, inline: true },
                                { name: "Địa chỉ", value: address, inline: false },
                                { name: "Món ăn", value: order.dish, inline: true },
                                { name: "Thành tiền", value: `${order.amount} VNĐ`, inline: true }
                            ],
                            timestamp: order.createdAt || new Date().toISOString()
                        }]
                    };

                    try {
                        await fetch(webhookUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(discordMessage)
                        });
                        context.log(`Đã gửi thông báo Discord cho đơn ${order.id}`);
                    } catch (err) {
                        context.log(`Lỗi gửi Discord Webhook: ${err.message}`);
                    }
                }
            }
        }
    }
});