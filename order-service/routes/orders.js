const express = require('express');
const axios = require('axios');
const router = express.Router();

const inventoryServiceURL = 'https://localhost:3002/api/inventory'; // Inventory service URL

let orders = [];
let nextOrderId = 1;

// To Ignore Self-Signed Certificates
const httpsAgent = new require('https').Agent({
    rejectUnauthorized: false,
});

// Fetch all orders or a customer's orders
router.get('/', (req, res) => {
    const { 'user-role': role, 'user-id': userId } = req.headers;

    if (!role || !userId) {
        return res.status(400).json({ message: 'User role or ID is missing in the request headers.' });
    }

    if (role === 'admin') {
        return res.status(200).json({ message: 'All orders fetched', orders });
    }

    const parsedUserId = parseInt(userId, 10);
    if (isNaN(parsedUserId)) {
        return res.status(400).json({ message: 'Invalid user ID.' });
    }

    const userOrders = orders.filter(order => parseInt(order.customerId, 10) === parsedUserId);

    if (userOrders.length === 0) {
        return res.status(404).json({ message: 'No orders found for this user.' });
    }

    return res.status(200).json({ message: 'User orders fetched', orders: userOrders });
});

// Route To Fetch Orders by Customer ID
router.get('/:customerId', (req, res) => {
    const { 'user-role': role, 'user-id': userId } = req.headers;
    const { customerId } = req.params;

    if (!role || !userId) {
        return res.status(400).json({ error: 'Role or User ID is missing in the request headers.' });
    }

    const parsedCustomerId = parseInt(customerId, 10);
    const parsedUserId = parseInt(userId, 10);

    if (role === 'admin') {
        const userOrders = orders.filter(order => parseInt(order.customerId, 10) === parsedCustomerId);
        if (userOrders.length === 0) {
            return res.status(404).json({ message: 'No orders found for this customer.' });
        }
        return res.status(200).json({ message: 'Customer orders fetched', orders: userOrders });
    }


    return res.status(403).json({ error: 'Access denied. Only admin can fetch customer orders by users ID.' });
});

// Route to Create Order 
router.post('/', async (req, res) => {
    const { 'user-role': role, 'user-id': userId } = req.headers;
    const { productId, quantity } = req.body;

    if (role !== 'customer') {
        return res.status(403).json({ error: 'Only customers can create an order.' });
    }

    if (!productId || !quantity) {
        return res.status(400).json({ message: 'Product ID and quantity are required.' });
    }

    if (!userId) {
        return res.status(403).json({ error: 'User ID is missing in the headers.' });
    }

    try {
        const productResponse = await axios.get(`${inventoryServiceURL}/${productId}`, { httpsAgent });
        const product = productResponse.data;

        if (product.quantity < quantity) {
            return res.status(400).json({ message: 'Insufficient stock.' });
        }

        const updatedProductResponse = await axios.put(`${inventoryServiceURL}/${productId}`, {
            quantity: product.quantity - quantity,
        }, { httpsAgent });

        const allowedStatuses = ['pending', 'processing', 'completed'];

        const newStatus = 'pending';

        if (!allowedStatuses.includes(newStatus)) {
            return res.status(400).json({ message: `Invalid status. Allowed statuses are: ${allowedStatuses.join(', ')}` });
        }

        const newOrder = {
            id: nextOrderId++, 
            productId,
            quantity,
            status: newStatus,
            customerId: userId, 
        };

        orders.push(newOrder);

        res.status(201).json({
            message: 'Order created successfully.',
            order: newOrder,
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Failed to create order.' });
    }
});


// Route to Update Order (Status or Details)
router.put('/:orderId', (req, res) => {
    const { 'user-role': role, 'user-id': userId } = req.headers;
    const { orderId } = req.params;
    const { status, quantity } = req.body;

    if (!role || !userId) {
        return res.status(400).json({ error: 'Role and User ID are required.' });
    }

    if (status !== 'pending' && status != 'processing' && status != 'completed') {
        return res.status(400).json({ message: 'Invalid Status!'});
    }

    const order = orders.find(o => o.id === parseInt(orderId));

    if (!order) {
        return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.status !== 'pending') {
        return res.status(400).json({ error: 'You can only edit the order if its status is pending.' });
    }

    if (role === 'admin') {
        if (status) order.status = status; 
        if (quantity) order.quantity = quantity;  
        return res.status(200).json({ message: 'Order updated successfully', order });
    }

    if (role === 'customer' && order.customerId === parseInt(userId, 10)) {
        if (status) order.status = status;  
        if (quantity) order.quantity = quantity;  
        return res.status(200).json({ message: 'Order updated successfully', order });
    }

    return res.status(403).json({ error: 'You can only update your own orders, or if you are an admin.' });
});



// Route to Delete an Order by ID
router.delete('/:orderId', (req, res) => {
    const { 'user-role': role, 'user-id': userId } = req.headers;
    const orderId = parseInt(req.params.orderId, 10);

    if (!role || !userId) {
        return res.status(400).json({ error: 'Role or User ID is missing in the request headers.' });
    }

    const orderIndex = orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
        return res.status(404).json({ message: 'Order not found.' });
    }

    const order = orders[orderIndex];

    if (order.status !== 'pending') {
        return res.status(400).json({ error: 'Order cannot be deleted because its status is not pending.' });
    }

    if (role === 'customer' && order.customerId === parseInt(userId, 10)) {
        orders.splice(orderIndex, 1);  
        return res.status(200).json({ message: 'Order deleted successfully' });
    }

    return res.status(403).json({ error: 'You can only delete your own orders. Admins are not allowed to delete orders.' });
});


module.exports = router;