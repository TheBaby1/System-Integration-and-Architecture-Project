const fs = require('fs'); 
const https = require('https');
const express = require('express');
const cors = require('cors');
const customerRoutes = require('./routes/customers');

const app = express();

app.use(cors());
app.use(express.json());

// Read Server Certificate Key
const options = {
    key: fs.readFileSync('D:/IT 3103 Final Project/certs/server.key'),
    cert: fs.readFileSync('D:/IT 3103 Final Project/certs/server.crt'),
};

// Use the customer routes as middleware under '/api/customers'
app.use('/api/customers', customerRoutes);

// Creating an HTTPS Server
https.createServer(options, app).listen(3001, () => {
    console.log('CRM Service running on port 3001');
});
