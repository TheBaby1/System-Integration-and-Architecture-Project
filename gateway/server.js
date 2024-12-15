// const express = require('express');
// const axios = require('axios');
// const cors = require('cors');
// const jwt = require('jsonwebtoken');
// const customerRoutes = require('./routes/customers');
// const inventoryRoutes = require('./routes/inventory');
// const ticketsRoutes = require('./routes/tickets');

// const JWT_SECRET = 'your_secret_key'; 

// // Initialize Express
// const app = express();

// // Middleware to parse JSON requests
// app.use(express.json());
// app.use(cors());

// // Middleware to Authenticate JWT Tokens (Only used for routes that need token)
// function authenticateToken(req, res, next) {
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1]; // Get the token from 'Bearer <token>'

//     if (!token) {
//         return res.status(401).json({ message: 'Access denied: No token provided' });
//     }

//     jwt.verify(token, JWT_SECRET, (err, user) => {
//         if (err) {
//             return res.status(403).json({ message: 'Invalid token' });
//         }
//         req.user = user; // Attach user info to request object
//         next();
//     });
// }

// // Routes
// app.use('/api/customers', customerRoutes); // Customer routes (with authentication for CRUD operations)
// app.use('/api/inventory', inventoryRoutes); // Inventory routes (with authentication)
// app.use('/api/tickets', ticketsRoutes); // Tickets routes (with authentication)

// // Error handling for undefined routes
// app.use((req, res, next) => {
//     res.status(404).json({ message: 'Route not found' });
// });

// // Global error handler
// app.use((err, req, res, next) => {
//     console.error('Server Error:', err.message);
//     res.status(500).json({ message: 'Internal Server Error' });
// });

// // Start the server
// app.listen(3000, () => {
//     console.log('API Gateway running on port 3000');
// });


const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const customerRoutes = require('./routes/customers');  // Gateway routes that are forwarded to CRM
const ticketsRoutes = require('./routes/tickets');


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Use the customer routes (this handles routes like /api/customers)
app.use('/api/customers', customerRoutes);
app.use('/api/tickets', ticketsRoutes);

app.listen(3000, () => {
    console.log('API Gateway running on port 3000');
});
