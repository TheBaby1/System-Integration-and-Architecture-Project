const https = require('https');
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const JWT_SECRET = 'your_secret_key'; // Same secret used by the gateway to sign tokens
const orderServiceURL = 'https://localhost:3004/api/orders'; // Order service URL

// To Ignore Self-Signed Certificates
const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

// Function to decode token and extract user info
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        req.user = decoded;
        next();
    });
};

// Admin Authorization Middleware
const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Admins only' });
    }
    next();
};

// Rate limiter
let limiter = rateLimit({
    max: 5,
    windowMs: 30 * 1000,
    message: 'You have exceeded the maximum number of allowed requests. Please try again later.',
});

async function forwardToOrderService(req, res, method, endpoint, data = null) {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        const headers = token ? {
            Authorization: `Bearer ${token}`,
            'user-id': req.user?.id,     
            'user-role': req.user?.role,  
        } : {};

        console.log('Forwarded Header: ', headers);

        const options = {
            method,
            url: `${orderServiceURL}${endpoint}`,
            headers,
            data,
            httpsAgent,
        };

        const response = await axios(options);
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response){
            res.status(error.response.status).json({
                error: 'Order Service Error',
                message: error.response.data,
            });
        } else {
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'An error occured while processing your request.',
            })
        }
    }
}

// Routes
router.get('/', authenticateToken, limiter, (req, res) => forwardToOrderService(req, res, 'GET', '/')); // Route To Get All Orders
router.get('/:customerId', authenticateToken, authorizeAdmin, limiter, (req, res) => forwardToOrderService(req, res, 'GET', `/${req.params.customerId}`)); // Route To Get Order by Customer ID
router.post('/', authenticateToken, limiter, (req, res) => forwardToOrderService(req, res, 'POST', '/', req.body)); // Route To Create Order
router.put('/:orderId', authenticateToken, limiter, (req, res) => forwardToOrderService(req, res, 'PUT', `/${req.params.orderId}`, req.body)); // Route To Update Order
router.delete('/:orderId',authenticateToken, limiter,(req, res) => forwardToOrderService(req, res, 'DELETE', `/${req.params.orderId}`)); // Route To Delete Order

module.exports = router;
