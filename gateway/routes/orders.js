const https = require('https');
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const JWT_SECRET = 'your_secret_key';
const orderServiceURL = 'https://localhost:3004/api/orders'; // Order service URL

// To Ignore Self-Signed Certificates
const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

// Token Authentication Middleware
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

// Rate limiter
let limiter = rateLimit({
    max: 5,
    windowMs: 30 * 1000,
    message: 'You have exceeded the maximum number of allowed requests. Please try again later.',
});

// Forward request to Order Service
async function forwardToOrderService(req, res, method, endpoint, data = null) {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

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
        const status = error.response ? error.response.status : 500;
        const message = error.response ? error.response.data : 'Internal Server Error';
        res.status(status).json({ error: 'Order Service Error', message });
    }
}

// Routes
router.get('/', limiter, (req, res) => forwardToOrderService(req, res, 'GET', '/'));
router.post('/', authenticateToken, limiter, (req, res) => forwardToOrderService(req, res, 'POST', '/', req.body));
router.put('/:orderId', authenticateToken, limiter, (req, res) => forwardToOrderService(req, res, 'PUT', `/${req.params.orderId}`, req.body));
router.delete('/:orderId', authenticateToken, limiter, (req, res) => forwardToOrderService(req, res, 'DELETE', `/${req.params.orderId}`));

module.exports = router;
