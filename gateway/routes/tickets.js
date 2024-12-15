const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = 'your_secret_key'; 
const crmServiceURL = 'http://localhost:3003/api/tickets';

const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        console.log('Decoded token:', decoded);  
        req.user = decoded;  
        next();
    });
};

async function forwardToCRMService(req, res, method, endpoint, data = null) {
    try {
        const token = req.headers['authorization']?.split(' ')[1];  
        const headers = token ? {
            Authorization: `Bearer ${token}`,
            'User-Id': req.user?.id, 
            'User-Role': req.user?.role,  
        } : {};

        console.log('Forwarding headers:', headers);  

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


router.get('/', authenticateToken, (req, res) => {
    const { role, id: customerId } = req.user; 

    if (!role || !customerId) {
        return res.status(400).json({ error: 'User role or ID is missing' });
    }

    forwardToCRMService(req, res, 'GET', '/', null, { 
        'User-Role': role, 
        'User-Id': customerId 
    });
});

router.get('/:customerId', authenticateToken, (req, res) => {
    const { role, id: customerId } = req.user;  
    const { customerId: requestedCustomerId } = req.params; 

    console.log("Forwarding headers:", {
        Authorization: req.headers['authorization'],
        'User-Id': customerId,
        'User-Role': role  
    });

    if (role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    forwardToCRMService(req, res, 'GET', `/${requestedCustomerId}`, null, { 
        'User-Role': role, 
        'User-Id': customerId  
    });
});




router.post('/', authenticateToken, (req, res) => {
    const { id: customerId } = req.user; 
    const data = { customerId, ...req.body }; 
    forwardToCRMService(req, res, 'POST', '/', data);
});

router.put('/:ticketId', authenticateToken, (req, res) => {
    forwardToCRMService(req, res, 'PUT', `/${req.params.ticketId}`, req.body);
});

router.delete('/:ticketId', authenticateToken, (req, res) => {
    forwardToCRMService(req, res, 'DELETE', `/${req.params.ticketId}`);
});

module.exports = router;
