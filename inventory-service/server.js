const express = require('express');
const cors = require('cors');
const inventoryRoutes = require('./routes/inventory');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/inventory', inventoryRoutes);

app.listen(3002, () => {
    console.log('Inventory Service running on port 3002');
})