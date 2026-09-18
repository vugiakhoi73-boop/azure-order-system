const { app } = require('@azure/functions');

app.http('UpdateOrder', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
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
            let body = {};
            try {
                body = await request.json();
            } catch (e) {
                const rawText = await request.text();
                body = rawText ? JSON.parse(rawText) : {};
            }

            const { orderId, status } = body;

            if (!orderId) {
                return {
                    status: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ error: 'Thiếu orderId' })
                };
            }

            return {
                status: 200,
                headers: corsHeaders,
                body: JSON.stringify({ 
                    message: 'Cập nhật thành công', 
                    orderId: orderId, 
                    status: status || 'Completed' 
                })
            };
        } catch (error) {
            return {
                status: 500,
                headers: corsHeaders,
                body: JSON.stringify({ error: error.message })
            };
        }
    }
});