const { app } = require('@azure/functions');

app.cosmosDB('ProcessAlert', {
    connection: 'CosmosDBConnectionString',
    databaseName: 'OrderDB',
    containerName: 'Orders',
    createLeaseContainerIfNotExists: true,
    handler: async (documents, context) => {
        if (!!documents && documents.length > 0) {
            for (let order of documents) {
                if (order.status === 'Pending') {
                    const phone = order.customerPhone ? order.customerPhone : 'Không có';
                    const address = order.customerAddress ? order.customerAddress : 'Không có';

                    const discordMessage = {
                        content: `🍜 **CÓ ĐƠN HÀNG MỚI!**\n\n**Mã đơn**\n${order.id}\n**Khách hàng**\n${order.customerName}\n**Số điện thoại**\n${phone}\n**Địa chỉ**\n${address}\n**Món ăn**\n${order.dish}\n**Thành tiền**\n${order.amount} VNĐ`
                    };
                    
                    const webhookUrl = process.env.DISCORD_WEBHOOK_URL; 

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