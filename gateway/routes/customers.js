const express = require('express');
const axios = require('axios');
const router = express.Router();

// GET request to retrieve Customers
router.get('/', async (req, res) => {
    const response = await axios.get('http://localhost:3001/api/customers');
    res.status(200).json(response.data);
});

// POST request to Create a new customer
router.post('/', async (req, res) => {

    try {
        const newCustomer = req.body;
        const response = await axios.post('http://localhost:3001/api/customers', newCustomer);
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Failed to Create Customer Account', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// PUT request to Update a Customer by ID
router.put('/:id', async (req, res) => {

    try {
        const customerId = req.params.id;
        const updatedCustomerData = req.body;

        const response = await axios.put(`http://localhost:3001/api/customers/${customerId}`, updatedCustomerData);
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Failed to Update Customer', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// DELETE request to Delete a Customer by ID
router.delete('/:id', async (req, res) => {

    try {
        const customerId = req.params.id;
        const response = await axios.delete(`http://localhost:3001/api/customers/${customerId}`);

        res.status(200).json(response.data);
    } catch (error) {
        console.error('Failed to Delete Customer', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

module.exports = router;