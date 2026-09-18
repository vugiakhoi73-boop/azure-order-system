const { app, output } = require('@azure/functions');

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
            // Đọc body dữ liệu an toàn
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
                amount: Number(body.amount) || 45000,
                status: 'Pending',
                paymentStatus: 'Paid',
                createdAt: new Date().toISOString()
            };

            // Lưu dữ liệu vào Cosmos DB
            context.extraOutputs.set(cosmosOutput, newOrder);

            return {
                status: 201,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Tạo đơn thành công!', order: newOrder })
            };
        } catch (error) {
            context.log(`Error: ${error.message}`);
            return {
                status: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Dữ liệu gửi lên không hợp lệ', details: error.message })
            };
        }
    }
});