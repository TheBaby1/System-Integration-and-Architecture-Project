const express = require('express');
const axios = require('axios');
const router = express.Router();

// GET request to retrieve Tickets by Customer ID
router.get('/customer/:customerId', async (req, res) => {
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

// GET request to retrieve All Tickets
router.get('/', async (req, res) => {

    const response = await axios.get('http://localhost:3003/api/tickets');
    res.status(200).json(response.data);
})

// POST request to Create Tickets
router.post('/', async (req, res) => {

    try {
        const newTicket = req.body;
        const response = await axios.post('http://localhost:3003/api/tickets', newTicket);
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Failed to Create Ticket', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// PUT request to Update Ticket (Status or Issue)
router.put('/:ticketId', async (req, res) => {

    try {
        const ticketId = req.params.ticketId;
        const updatedTicketData = req.body;

        const response = await axios.put(`http://localhost:3003/api/tickets/${ticketId}`, updatedTicketData);
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Failed to Update Ticket', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// DELETE request to Delete Ticket
router.delete('/:ticketId', async (req, res) => {

    try {
        const ticketId = req.params.ticketId;
        const response = await axios.delete(`http://localhost:3003/api/tickets/${ticketId}`);
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Failed to Delete Ticket', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

module.exports = router;