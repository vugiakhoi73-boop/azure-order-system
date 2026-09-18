const { app, output } = require('@azure/functions');

const cosmosOutput = output.cosmosDB({
    databaseName: 'OrderDB',
    containerName: 'Orders',
    connection: 'CosmosDBConnectionString'
});

app.http('CreateOrder', {
    methods: ['POST', 'OPTIONS'], // Bổ sung OPTIONS để hỗ trợ CORS preflight
    authLevel: 'anonymous',
    extraOutputs: [cosmosOutput],
    handler: async (request, context) => {
        // Khai báo Header hỗ trợ CORS cho mọi response
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
        };

        // Bắt request OPTIONS từ trình duyệt
        if (request.method === 'OPTIONS') {
            return { status: 204, headers: corsHeaders };
        }

        try {
            const body = await request.json();

            if (!body.customerName || !body.item || !body.price) {
                return { 
                    status: 400, 
                    headers: corsHeaders,
                    jsonBody: { error: 'Thiếu thông tin đơn hàng!' } 
                };
            }

            const orderDocument = {
                id: `ORD-${Date.now()}`,
                category: "Electronics",
                customerName: body.customerName,
                item: body.item,
                price: body.price,
                createdAt: new Date().toISOString()
            };

            context.extraOutputs.set(cosmosOutput, orderDocument);

            return {
                status: 200,
                headers: corsHeaders,
                jsonBody: {
                    message: 'Đã tạo đơn hàng thành công!',
                    orderId: orderDocument.id
                }
            };
        } catch (error) {
            context.error('Lỗi khi xử lý đơn hàng:', error);
            return { 
                status: 500, 
                headers: corsHeaders,
                jsonBody: { error: 'Lỗi hệ thống nội bộ.' } 
            };
        }
    }
});