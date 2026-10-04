const { app, output } = require('@azure/functions');

// Khai báo output binding để ghi vào Cosmos DB
const cosmosOutput = output.cosmosDB({
    databaseName: 'OrderDB',
    containerName: 'Orders',
    connection: 'CosmosDBConnectionString',
    createIfNotExists: true
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

        // Xử lý Preflight request từ trình duyệt (CORS)
        if (request.method === 'OPTIONS') {
            return { status: 200, headers: corsHeaders };
        }

        try {
            // Lấy dữ liệu JSON từ Frontend
            const reqBody = await request.json();
            const { customerName, customerPhone, customerAddress, dish, amount } = reqBody;

            if (!customerName || !dish || !amount) {
                return {
                    status: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ error: "Thiếu thông tin bắt buộc (Tên, Món, Giá tiền)." })
                };
            }

            // Tạo đối tượng đơn hàng
            const orderId = Date.now().toString(); 
            const newOrder = {
                id: orderId,
                customerName: customerName,
                customerPhone: customerPhone || "Không có",
                customerAddress: customerAddress || "Không có",
                dish: dish,
                amount: amount,
                status: "Pending",
                createdAt: new Date().toISOString()
            };

            // Ghi dữ liệu vào Cosmos DB
            context.extraOutputs.set(cosmosOutput, newOrder);

            return {
                status: 200,
                headers: corsHeaders,
                body: JSON.stringify({ 
                    message: "Tạo đơn hàng thành công", 
                    order: newOrder 
                })
            };
        } catch (error) {
            context.log(`Lỗi khi tạo đơn hàng: ${error.message}`);
            return {
                status: 500,
                headers: corsHeaders,
                body: JSON.stringify({ error: "Lỗi máy chủ nội bộ: " + error.message })
            };
        }
    }
});