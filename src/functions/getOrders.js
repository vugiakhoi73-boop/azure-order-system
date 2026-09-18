const { app, input } = require('@azure/functions');

// Khai báo input binding lấy dữ liệu từ Cosmos DB
const cosmosInput = input.cosmosDB({
    databaseName: 'OrderDB',
    containerName: 'Orders',
    connection: 'CosmosDBConnectionString',
    sqlQuery: "SELECT * FROM c WHERE c.paymentStatus = 'Paid' AND c.status != 'Completed' ORDER BY c._ts DESC"
});

app.http('GetOrders', {
    methods: ['GET', 'OPTIONS'],
    authLevel: 'anonymous',
    extraInputs: [cosmosInput],
    handler: async (request, context) => {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
        };

        if (request.method === 'OPTIONS') {
            return { status: 200, headers: corsHeaders };
        }

        try {
            const orders = context.extraInputs.get(cosmosInput) || [];
            return {
                status: 200,
                headers: corsHeaders,
                body: JSON.stringify(orders)
            };
        } catch (error) {
            context.log(`Error fetching orders: ${error.message}`);
            return {
                status: 500,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Không thể lấy danh sách đơn hàng.' })
            };
        }
    }
});