const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = 'your_secret_key';
const crmServiceURL = 'http://localhost:3001/api/customers';  

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

// Register route
router.post('/register', async (req, res) => {
    await forwardToCRMService(req, res, 'POST', '/register', req.body);
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const response = await axios.post(`${crmServiceURL}/login`, { email, password });

        if (response.status === 200) {
            const token = jwt.sign(
                { id: response.data.customer.id, role: response.data.customer.role },
                JWT_SECRET,
                { expiresIn: '1h' }
            );            
            res.status(200).json({ message: 'Login successful', token, customer: response.data.customer });
        } else {
            res.status(response.status).json(response.data);
        }
    } catch (error) {
        console.error('Login failed:', error);
        res.status(500).json({
            error: 'Login Failed',
            message: 'An error occurred during the login process.',
        });
    }
});

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

router.get('/', authenticateToken, async (req, res) => {
    if (req.user.role === 'admin') {
        await forwardToCRMService(req, res, 'GET', '/');
    } else {
        await forwardToCRMService(req, res, 'GET', `/${req.user.id}`);
    }
});

// Update customer info
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    if (req.user.role === 'admin' || req.user.id === parseInt(id)) {
        try {
            await forwardToCRMService(req, res, 'PUT', `/${id}`, req.body);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to update customer',
                message: error.message || 'An unexpected error occurred.',
            });
        }
    } else {
        return res.status(403).json({
            message: 'Permission denied: You can only update your own account or if you are an admin.',
        });
    }
});


router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    if (req.user.id !== parseInt(id)) {
        return res.status(403).json({
            message: 'Permission denied: You can only delete your own account.',
        });
    }

    if (req.user.role === 'admin') {
        try {
            await forwardToCRMService(req, res, 'DELETE', `/${id}`);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to delete customer',
                message: error.message || 'An unexpected error occurred.',
            });
        }
    } 
    else if (req.user.id === parseInt(id)) {
        try {
            await forwardToCRMService(req, res, 'DELETE', `/${id}`);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to delete customer',
                message: error.message || 'An unexpected error occurred.',
            });
        }
    } else {
        return res.status(403).json({
            message: 'Permission denied: Only admins can delete users, or users can delete their own account.',
        });
    }
});



module.exports = router;
