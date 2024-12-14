const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = 'your_secret_key';  
const crmServiceURL = 'http://localhost:3002/api/inventory';  

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

function authorizeAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied: Admins only' });
    }
    next();
}

router.post('/', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const newProduct = req.body;

        const response = await axios.post(crmServiceURL, newProduct, {
            headers: {
                Authorization: `Bearer ${req.headers['authorization'].split(' ')[1]}`
            }
        });
        
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Failed to Create New Product', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const productId = req.params.id;
        const updatedProductData = req.body;
        const response = await axios.put(`${crmServiceURL}/${productId}`, updatedProductData);
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Failed to Update Product', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const productId = req.params.id;
        const response = await axios.delete(`${crmServiceURL}/${productId}`);
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Failed to Delete Product', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
