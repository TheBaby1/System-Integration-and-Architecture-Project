const express = require('express');
const router = express.Router();

const tickets = [];

// Route for Creating Support Tickets
router.post('/', (req, res) => {

    try {
        const { customerId, issue } = req.body;
        const newTicket = { id: Date.now(), customerId, issue, status: 'open' };

        if (!customerId || !issue) {
            return res.status(400).json({ error: 'customerId and issue are required' });
        }
        
        tickets.push(newTicket);
        res.status(200).json({ message: 'Successfully Created Ticket' });
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route for Retrieving all Tickets
router.get('/', (req, res) => {

    try {
        res.status(200).json(tickets);
    } catch (error) {
        console.error('Failed to Retrieve Tickets', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// Route for Retrieving Ticket by Customer ID
router.get('/customer/:customerId', (req, res) => {

    try {
        const { customerId } = req.params;
        const customerTickets = tickets.filter(t => t.customerId == customerId);

        if (customerTickets.length === 0) {
            return res.status(404).json({ error: 'No Ticket Found For This Customer' });
        }

        res.status(200).json(customerTickets);
    } catch (error) {
        console.error('Failed to Retrieve Ticket by Customer ID', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route for Retrieving Ticket by Ticket ID
router.get('/:ticketId', (req, res) => {

    try {
        const { ticketId } = req.params;
        const ticket = tickets.find(t => t.id === parseInt(ticketId));

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket Not Found' });
        }

        res.status(200).json(ticket);
    } catch (error) {
        console.error('Failed to Retrieve Ticket by Ticket ID', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// Route to Update Ticket Status by Ticket ID
router.put('/:ticketId/status', (req, res) => {

    try {
        const { ticketId } = req.params;
        const { status } = req.body;
        const ticket = tickets.find(t => t.id === parseInt(ticketId));

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket Not Found' });
        }

        if (!['open', 'in progress', 'resolved', 'closed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        ticket.status = status;
        res.status(200).json({ message: 'Successfully Updated Ticket' });
    } catch (error) {
        console.error('Failed to Update Ticket Status', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// Route to Update a Ticket Issue or Status
router.put('/:ticketId', (req, res) => {

    try {
        const { ticketId } = req.params;
        const { issue, status } = req.body;
        const ticket = tickets.find(t => t.id == parseInt(ticketId));

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket Not Found' });
        }

        if (status && ['open', 'in progress', 'resolved', 'closed'].includes(status)) {
            ticket.status = status;
        }

        if (issue) {
            ticket.issue = issue;
        }

        res.status(200).json({ message: 'Successfully Updated Ticket' });
    } catch (error) {
        console.error('Failed to Update the Ticket', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// Route to Delete A Ticket by Ticket ID
router.delete('/:ticketId', (req, res) => {

    try {
        const { ticketId } = req.params;
        const index = tickets.findIndex(t => t.id === parseInt(ticketId));

        if (index === -1) {
            return res.status(404).json({ error: 'Ticket not Found' });
        }

        tickets.splice(index, 1);
        res.status(200).json({ message: 'Successfully Deleted Ticket' });
    } catch (error) {
        console.error('Failed to Delete Ticket', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

module.exports = router;