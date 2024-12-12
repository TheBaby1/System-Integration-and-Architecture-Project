const express = require('express');
const cors = require('cors');
const ticketRoutes = require('./routes/tickets');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/tickets', ticketRoutes);

app.listen(3003, () => {
    console.log('Support Service listening on port 3003');
})