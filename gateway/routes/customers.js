const https = require('https');
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const JWT_SECRET = 'your_secret_key';
const crmServiceURL = 'https://localhost:3001/api/customers';  

// To Ignore Self-Signed Certificates
const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

// Forward request to CRM service
async function forwardToCRMService(req, res, method, endpoint, data = null) {
    try {
        const token = req.headers['authorization']?.split(' ')[1];  

        const headers = token ? {
            Authorization: `Bearer ${token}`,
            'User-Id': req.user?.id,  
            'User-Role': req.user?.role,  
        } : {};

        const options = {
            method: method,
            url: `${crmServiceURL}${endpoint}`,
            headers: headers,
            data: data,
            httpsAgent: httpsAgent,  
        };
        

        const response = await axios(options);

        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            console.error(`CRM Service Error: ${error.response.status} - ${error.response.data}`);
            res.status(error.response.status).json({
                error: 'CRM Service Error',
                message: error.response.data || 'Something went wrong on the CRM service',
            });
        } else if (error.request) {
            console.error('CRM Service Error: No response received', error);
            res.status(500).json({
                error: 'CRM Service Error',
                message: 'No response received from the CRM service',
            });
        } else {
            console.error('Error in gateway service:', error.message);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'An error occurred while processing your request.',
            });
        }
    }
}

// Token Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];  

    if (!token) {
        return res.status(401).json({ message: 'Access denied: No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;  
        next();
    });
}

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

// CRM-SERVICE ROUTES
router.get('/', authenticateToken, limiter, (req, res) => forwardToCRMService(req, res, 'GET', '/')); // Route To Get All Users
router.post('/', authenticateToken, authorizeAdmin, limiter, (req, res) => forwardToCRMService(req, res, 'POST', '/', req.body)); // Route To Create Users
router.put('/:id', authenticateToken, limiter, (req, res) => forwardToCRMService(req, res, 'PUT', `/${req.params.id}`, req.body)); // Route To Update Users
router.delete('/:id', authenticateToken, limiter, (req, res) => forwardToCRMService(req, res, 'DELETE', `/${req.params.id}`)); // Route To Delete Users

// Authentication ROUTES
router.post('/register', limiter, (req, res) => forwardToCRMService(req, res, 'POST', '/register', req.body)); // Route For User Registration
router.post('/login', limiter, (req, res) => forwardToCRMService(req, res, 'POST', '/login', req.body)); // Route For User and Admin Login


module.exports = router;