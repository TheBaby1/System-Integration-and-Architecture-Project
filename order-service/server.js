const fs = require('fs');
const https = require('https');
const express = require('express');
const cors = require('cors');
const orderRoutes = require('./routes/orders');

const app = express();

app.use(cors());
app.use(express.json());

// Read Server Certificate Key
const options = {
    key: fs.readFileSync('../certs/server.key'),
    cert: fs.readFileSync('../certs/server.crt'),
};

app.use('/api/orders', orderRoutes);

// Creating an HTTPS Server
https.createServer(options, app).listen(3004, () => {
    console.log('Order Service running on port 3004');
});
