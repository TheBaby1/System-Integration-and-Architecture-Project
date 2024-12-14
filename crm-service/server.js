const express = require('express');
const cors = require('cors');
const customerRoutes = require('./routes/customers');

const app = express();

app.use(cors());
app.use(express.json());

// Use the customer routes as middleware under '/api/customers'
app.use('/api/customers', customerRoutes);

app.listen(3001, () => {
    console.log('CRM Service running on port 3001');
});
