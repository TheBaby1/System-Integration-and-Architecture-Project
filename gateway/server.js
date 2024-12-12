const express = require('express');
const cors = require('cors');
const axios = require('axios');

const customersRoutes = require('./routes/customers');
const inventoryRoutes = require('./routes/inventory');
const ticketsRoutes = require('./routes/tickets');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/customers', customersRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/tickets', ticketsRoutes);

app.listen(3000, () => {
    console.log('API Gateway running on port 3000');
});
