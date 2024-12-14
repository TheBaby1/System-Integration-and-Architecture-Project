const express = require('express');
const axios = require('axios');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const customerRoutes = require('./routes/customers');
const inventoryRoutes = require('./routes/inventory');
const ticketsRoutes = require('./routes/tickets');


const JWT_SECRET = 'your_secret_key'; 

// Initialize Express
const app = express();

// Middleware to parse JSON requests
app.use(express.json());
app.use(cors());

// Middleware to Authenticate JWT Tokens
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

// Routes
// Use the customer routes as middleware under '/api/customers'
app.use('/api/customers', customerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/tickets', ticketsRoutes);

// Error handling for undefined routes
app.use((req, res, next) => {
    res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err.message);
    res.status(500).json({ message: 'Internal Server Error' });
});

// Start the server
app.listen(3000, () => {
    console.log('API Gateway running on port 3000');
});

