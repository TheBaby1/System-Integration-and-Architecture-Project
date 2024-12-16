const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = 'your_secret_key';
const crmServiceURL = 'http://localhost:3001/api/customers';  

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
            console.error('CRM Service Error: No response received');
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

// Admin Authorization Middleware
const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Admins only' });
    }
    next();
};

// CRM-SERVICE ROUTES
router.get('/', authenticateToken, authorizeAdmin, (req, res) => forwardToCRMService(req, res, 'GET', '/'));
router.post('/', authenticateToken, authorizeAdmin, (req, res) => forwardToCRMService(req, res, 'POST', '/', req.body));
router.put('/:id', authenticateToken, authorizeAdmin, (req, res) => forwardToCRMService(req, res, 'PUT', `/${req.params.id}`, req.body));
router.delete('/:id', authenticateToken, authorizeAdmin, (req, res) => forwardToCRMService(req, res, 'DELETE', `/${req.params.id}`));

// Authentication ROUTES
router.post('/register', (req, res) => forwardToCRMService(req, res, 'POST', '/register', req.body));
router.post('/login', (req, res) => forwardToCRMService(req, res, 'POST', '/login', req.body));


module.exports = router;