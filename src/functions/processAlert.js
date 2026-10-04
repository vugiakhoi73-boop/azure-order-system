const fetch = require('node-fetch'); // Hoặc axios tùy bạn dùng

module.exports = async function (context, documents) {
    if (!!documents && documents.length > 0) {
        for (let order of documents) {
            
            // Chỉ thông báo khi có đơn hàng mới (trạng thái Pending)
            if (order.status === 'Pending') {
                
                // ==========================================
                // TỪ ĐÂY: XÓA ĐOẠN CODE TẠO discordMessage CŨ
                // VÀ DÁN ĐOẠN NÀY VÀO
                // ==========================================
                
                const phone = order.customerPhone ? order.customerPhone : 'Không có';
                const address = order.customerAddress ? order.customerAddress : 'Không có';

                const discordMessage = {
                    content: `🍜 **CÓ ĐƠN HÀNG MỚI!**\n\n**Mã đơn**\n${order.id}\n**Khách hàng**\n${order.customerName}\n**Số điện thoại**\n${phone}\n**Địa chỉ**\n${address}\n**Món ăn**\n${order.dish}\n**Thành tiền**\n${order.amount} VNĐ`
                };
                
                // ==========================================
                // KẾT THÚC ĐOẠN DÁN
                // ==========================================

                // Lấy URL Webhook từ biến môi trường (hoặc dán cứng URL vào đây)
                const webhookUrl = process.env.DISCORD_WEBHOOK_URL; 

                // Gửi HTTP POST request tới Discord
                try {
                    await fetch(webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(discordMessage)
                    });
                    context.log(`Đã gửi thông báo Discord cho đơn ${order.id}`);
                } catch (err) {
                    context.log.error("Lỗi gửi Discord Webhook:", err);
                }
            }
        }
    }
}