const https = require('https');
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const JWT_SECRET = 'your_secret_key';
const crmServiceURL = 'https://localhost:3003/api/tickets';

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
    message: 'You have exceeded the maximum number of allowed requests. Please try again later.'
});


// Forward Request to Support-Service
async function forwardToCRMService(req, res, method, endpoint, data = null) {
    try {
        const token = req.headers['authorization']?.split(' ')[1];  
        const headers = token ? {
            Authorization: `Bearer ${token}`,
            'user-id': req.user?.id,     
            'user-role': req.user?.role,  
        } : {};

        console.log('Forwarded Headers:', headers);

        const options = {
            method: method,
            url: `${crmServiceURL}${endpoint}`,
            headers,  
            data,
            httpsAgent: httpsAgent,  
        };

        const response = await axios(options);
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json({
                error: 'CRM Service Error',
                message: error.response.data,
            });
        } else {
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'An error occurred while processing your request.',
            });
        }
    }
}

// SUPPORT-SERVICE ROUTES
router.get('/', authenticateToken, limiter, (req, res) => forwardToCRMService(req, res, 'GET', '/')); // Route To Get All Tickets
router.get('/:customerId', authenticateToken, limiter, (req, res) => forwardToCRMService(req, res, 'GET', `/${req.params.customerId}`)); // Route To Get Ticket by ID
router.post('/', authenticateToken, limiter, (req, res) => forwardToCRMService(req, res, 'POST', '/', { ...req.body, customerId: req.user.id })); // Route To Create Ticket
router.put('/:ticketId', authenticateToken, authorizeAdmin, limiter, (req, res) => forwardToCRMService(req, res, 'PUT', `/${req.params.ticketId}`, req.body)); // Route To Update Tickets
router.delete('/:ticketId', authenticateToken, limiter, (req, res) => forwardToCRMService(req, res, 'DELETE', `/${req.params.ticketId}`)); // Route To Delete Ticket

module.exports = router;