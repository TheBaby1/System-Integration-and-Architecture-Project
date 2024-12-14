const express = require('express');
const axios = require('axios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = 'your_secret_key';  
const crmServiceURL = 'http://localhost:3001/api/customers'; 

//REGISTER
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide name, email, and password' });
        }

        const response = await axios.post(`${crmServiceURL}/register`, { name, email, password });
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error in gateway:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const response = await axios.post(`${crmServiceURL}/login`, { email, password });

        if (response.status === 200) {
            const token = jwt.sign({ id: response.data.customer.id, role: response.data.customer.role }, JWT_SECRET, { expiresIn: '1h' });
            res.status(200).json({ message: 'Login successful', token, customer: response.data.customer });
        } else {
            res.status(response.status).json(response.data);
        }
    } catch (error) {
        console.error('Login failed:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//ADMIN ONLY
router.get('/admin', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied: Admins only' });
    }
    res.status(200).json({ message: 'Welcome Admin!' });
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract token from 'Bearer <token>'

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

module.exports = router;
