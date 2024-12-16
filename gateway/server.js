const fs = require('fs'); 
const https = require('https');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const customerRoutes = require('./routes/customers'); 
const ticketsRoutes = require('./routes/tickets');
const inventoryRoutes = require('./routes/inventory');

const app = express();

app.use(cors());
app.use(express.json());

// Read Server Certificate Key
const options = {
    key: fs.readFileSync('D:/IT 3103 Final Project/certs/server.key'),
    cert: fs.readFileSync('D:/IT 3103 Final Project/certs/server.crt'),
};

app.use('/api/customers', customerRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/inventory', inventoryRoutes);

// Creating an HTTPS Server
https.createServer(options, app).listen(3000, () => {
    console.log('API Gateway running on port 3000');
});