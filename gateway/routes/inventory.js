const https = require('https');
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const JWT_SECRET = 'your_secret_key';
const crmServiceURL = 'https://localhost:3002/api/inventory';

// To Ignore Self-Signed Certificates
const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

// Token Authentication Middleware
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = decoded;
        next();
    });
};

// Rate limiter
let limiter = rateLimit({
    max: 5,
    windowMs: 30 * 1000,
    message: 'You have exceeded the maximum number of allowed requests. Please try again later.'
});

// Admin Authorization Middleware
const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Admins only' });
    }
    next();
};

// Forward request to Inventory Service
async function forwardToCRMService(req, res, method, endpoint, data = null) {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        const headers = token ? {
            Authorization: `Bearer ${token}`,
            'user-id': req.user?.id,
            'user-role': req.user?.role,
        } : {};

        const options = {
            method,
            url: `${crmServiceURL}${endpoint}`,
            headers,
            data,
            httpsAgent: httpsAgent,  
        };

        const response = await axios(options);
        res.status(response.status).json(response.data);
    } catch (error) {
        const status = error.response ? error.response.status : 500;
        const message = error.response ? error.response.data : 'Internal Server Error';
        res.status(status).json({ error: 'Inventory Service Error', message });
    }
}

// Routes
router.get('/', limiter, (req, res) => forwardToCRMService(req, res, 'GET', '/'));
router.get('/:productId', limiter, (req, res) => forwardToCRMService(req, res, 'GET', `/${req.params.productId}`));
router.post('/', authenticateToken, authorizeAdmin, limiter, (req, res) => forwardToCRMService(req, res, 'POST', '/', req.body));
router.put('/:id', authenticateToken, authorizeAdmin, limiter, (req, res) => forwardToCRMService(req, res, 'PUT', `/${req.params.id}`, req.body));
router.delete('/:id', authenticateToken, authorizeAdmin, limiter, (req, res) => forwardToCRMService(req, res, 'DELETE', `/${req.params.id}`));

module.exports = router;
