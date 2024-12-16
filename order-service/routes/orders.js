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

// Fetch all orders
router.get('/', (req, res) => {
    res.status(200).json(orders);
});

// Create a new order
router.post('/', async (req, res) => {
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
        return res.status(400).json({ message: 'Product ID and quantity are required.' });
    }

    try {
        // Check inventory availability
        const productResponse = await axios.get(`${inventoryServiceURL}/${productId}`, { httpsAgent });
        const product = productResponse.data;

        if (product.quantity < quantity) {
            return res.status(400).json({ message: 'Insufficient stock.' });
        }

        // Update inventory after placing the order
        const updatedProductResponse = await axios.put(`${inventoryServiceURL}/${productId}`, {
            quantity: product.quantity - quantity,
        }, { httpsAgent });

        // Create the order
        const newOrder = {
            id: nextOrderId++,
            productId,
            quantity,
            status: 'Created',
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

// Update an existing order
router.put('/:orderId', (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = orders.find(o => o.id === parseInt(orderId));

    if (!order) {
        return res.status(404).json({ message: 'Order not found.' });
    }

    if (status) order.status = status;

    res.status(200).json({ message: 'Order updated successfully.', order });
});

// Delete an order
router.delete('/:orderId', (req, res) => {
    const { orderId } = req.params;

    const orderIndex = orders.findIndex(o => o.id === parseInt(orderId));

    if (orderIndex === -1) {
        return res.status(404).json({ message: 'Order not found.' });
    }

    orders.splice(orderIndex, 1);

    res.status(200).json({ message: 'Order deleted successfully.' });
});

module.exports = router;
