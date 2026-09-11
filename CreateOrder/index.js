const { app, output } = require('@azure/functions');

const cosmosOutput = output.cosmosDB({
    databaseName: 'OrderDB',
    containerName: 'Orders',
    connection: 'CosmosDBConnectionString'
});

app.http('CreateOrder', {
    methods: ['POST'],
    authLevel: 'anonymous',
    extraOutputs: [cosmosOutput],
    handler: async (request, context) => {
        try {
            const body = await request.json();

            if (!body.customerName || !body.item || !body.price) {
                return { status: 400, body: 'Thiếu thông tin đơn hàng!' };
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
                jsonBody: {
                    message: 'Đã tạo đơn hàng thành công!',
                    orderId: orderDocument.id
                }
            };
        } catch (error) {
            context.error('Lỗi khi xử lý đơn hàng:', error);
            return { status: 500, body: 'Lỗi hệ thống nội bộ.' };
        }
    }
});