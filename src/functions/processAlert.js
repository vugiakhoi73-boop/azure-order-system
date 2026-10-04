const { app } = require('@azure/functions');

// Chèn link Discord Webhook trực tiếp vào đây
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

                    const discordMessage = {
                        content: `🍜 **CÓ ĐƠN HÀNG MỚI!**\n\n**Mã đơn**\n${order.id}\n**Khách hàng**\n${order.customerName}\n**Số điện thoại**\n${phone}\n**Địa chỉ**\n${address}\n**Món ăn**\n${order.dish}\n**Thành tiền**\n${order.amount} VNĐ`
                    };

                    try {
                        // Dùng hàm fetch mặc định của Node 18 để gửi request
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