const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = 'your_secret_key'; // Secret key for JWT verification
const crmServiceURL = 'http://localhost:3003/api/tickets'; // Microservice URL

// Middleware for authenticating the token
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        console.log('Decoded token:', decoded);  // Log the decoded token to verify its contents
        req.user = decoded;  // Attach decoded user to req.user
        next();
    });
};

async function forwardToCRMService(req, res, method, endpoint, data = null) {
    try {
        const token = req.headers['authorization']?.split(' ')[1];  // Extract token from Authorization header
        const headers = token ? {
            Authorization: `Bearer ${token}`,
            'User-Id': req.user?.id,  // Include user id from the token
            'User-Role': req.user?.role,  // Include user role from the token
        } : {};

        console.log('Forwarding headers:', headers);  // Log headers to ensure they are correct

        const options = {
            method: method,
            url: `${crmServiceURL}${endpoint}`,
            headers: headers,  // Forward the headers
            data: data,
        };

        const response = await axios(options);
        res.status(response.status).json(response.data);  // Send the response back to the client
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
    const { role, id: customerId } = req.user;  // Get role and customerId from token

    if (!role || !customerId) {
        return res.status(400).json({ error: 'User role or ID is missing' });
    }

    // Forward to CRM service with role and userId in headers
    forwardToCRMService(req, res, 'GET', '/', null, { 
        'User-Role': role, 
        'User-Id': customerId 
    });
});

// Gateway: Get specific customer tickets (admins only)
router.get('/:customerId', authenticateToken, (req, res) => {
    const { role, id: customerId } = req.user;  // Get role and customerId from the token
    const { customerId: requestedCustomerId } = req.params;  // Extract customerId from URL

    console.log("Forwarding headers:", {
        Authorization: req.headers['authorization'],
        'User-Id': customerId,
        'User-Role': role  // Ensure role is correctly forwarded
    });

    // If role is not admin, deny access
    if (role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    // Forward the request to the CRM service with role and customerId in the headers
    forwardToCRMService(req, res, 'GET', `/${requestedCustomerId}`, null, { 
        'User-Role': role, 
        'User-Id': customerId  // Send the customerId as part of the request headers
    });
});




// Gateway: Create a new ticket (automatically attaches customerId from token)
router.post('/', authenticateToken, (req, res) => {
    const { id: customerId } = req.user; // Get customerId from token
    const data = { customerId, ...req.body }; // Attach customerId to the ticket data
    forwardToCRMService(req, res, 'POST', '/', data);
});

// Gateway: Update a ticket
router.put('/:ticketId', authenticateToken, (req, res) => {
    forwardToCRMService(req, res, 'PUT', `/${req.params.ticketId}`, req.body);
});

// Gateway: Delete a ticket
router.delete('/:ticketId', authenticateToken, (req, res) => {
    forwardToCRMService(req, res, 'DELETE', `/${req.params.ticketId}`);
});

module.exports = router;
