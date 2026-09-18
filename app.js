const { app } = require('@azure/functions');

// Import logic từ các thư mục
const createOrder = require('./CreateOrder/index');
const getOrders = require('./GetOrders/index');
const processAlert = require('./ProcessAlert/index');

app.http('CreateOrder', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: createOrder
});

app.http('GetOrders', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getOrders
});

app.http('ProcessAlert', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: processAlert
});