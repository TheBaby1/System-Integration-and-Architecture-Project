const fs = require('fs'); 
const https = require('https');
const express = require('express');
const cors = require('cors');
const ticketRoutes = require('./routes/tickets');

const app = express();

app.use(cors());
app.use(express.json());

// Read Server Certificate Key
const options = {
    key: fs.readFileSync('../certs/server.key'),
    cert: fs.readFileSync('../certs/server.crt'),
};

app.use('/api/tickets', ticketRoutes);

// Creating an HTTPS Server
https.createServer(options, app).listen(3003, () => {
    console.log('Support Service running on port 3003');
});