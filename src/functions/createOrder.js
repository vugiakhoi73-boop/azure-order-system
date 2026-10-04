module.exports = async function (context, req) {
    try {
        // Lấy dữ liệu từ Frontend gửi lên, bao gồm cả SĐT và Địa chỉ mới
        const { customerName, customerPhone, customerAddress, dish, amount } = req.body;

        if (!customerName || !dish || !amount) {
            context.res = {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
                body: { error: "Thiếu thông tin bắt buộc (Tên, Món, Giá tiền)." }
            };
            return;
        }

        // Tạo ID đơn hàng ngẫu nhiên dựa trên thời gian
        const orderId = Date.now().toString(); 

        // Đóng gói đối tượng đơn hàng mới
        const newOrder = {
            id: orderId,
            customerName: customerName,
            customerPhone: customerPhone || "Không có",    // Thêm dòng này
            customerAddress: customerAddress || "Không có", // Thêm dòng này
            dish: dish,
            amount: amount,
            status: "Pending", // Trạng thái chờ bếp xử lý
            createdAt: new Date().toISOString()
        };

        // Ghi vào Cosmos DB qua Output Binding (đảm bảo tên binding trong function.json là outputDocument)
        context.bindings.outputDocument = newOrder;

        // Trả kết quả thành công về cho Frontend (Dữ liệu JSON hợp lệ)
        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: { 
                message: "Tạo đơn hàng thành công", 
                order: newOrder 
            }
        };

    } catch (error) {
        context.log.error("Lỗi khi tạo đơn hàng:", error);
        context.res = {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            body: { error: "Lỗi máy chủ nội bộ: " + error.message }
        };
    }
};