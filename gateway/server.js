const express = require('express');
const cors = require('cors');
const axios = require('axios');  

const app = express();

app.use(cors());
app.use(express.json());


app.get('/api/customers', async (req, res) => {
    const response = await axios.get('http://localhost:3001/api/customers');
    res.status(200).json(response.data);
});


app.get('/api/inventory', async (req, res) => {
    const response = await axios.get('http://localhost:3002/api/inventory');
    res.status(200).json(response.data);
});


app.get('/api/tickets/customer/:customerId', async (req, res) => {

    try {
      const { customerId } = req.params;
      console.log(`Fetching tickets for customerId: ${customerId}`);

      const response = await axios.get(`http://localhost:3003/api/tickets/customer/${customerId}`);
      res.status(200).json(response.data);
  } catch (error) {
      console.error('Failed to Retrieve Tickets from Support-Service', error);
      res.status(error.response?.status || 500).json({ error: 'Internal Server Error' });
  }
});



app.listen(3000, () => {
  console.log('API Gateway running on port 3000');
});
