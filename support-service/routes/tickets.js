const express = require('express');
const router = express.Router();

let tickets = [];
let ticketIdCounter = 1; 


router.post('/', (req, res) => {
    const { customerId, issue } = req.body; 

    if (!issue) {
        return res.status(400).json({ error: 'Issue is required.' });
    }

    if (!customerId) {
        return res.status(400).json({ error: 'CustomerId is missing in the request.' });
    }

    const newTicket = {
        id: ticketIdCounter++,
        customerId,
        issue,
        status: 'open',
    };

    tickets.push(newTicket);
    res.status(201).json({ message: 'Ticket created successfully', ticket: newTicket });
});

router.get('/', (req, res) => {
    const role = req.headers['user-role'];  
    const userId = req.headers['user-id'];  

    if (!role || !userId) {
        return res.status(400).json({ error: 'User role or ID missing in the request headers' });
    }

    if (role === 'admin') {
        return res.status(200).json({
            message: 'All tickets fetched',
            tickets: tickets 
        });
    }

    const userTickets = tickets.filter(ticket => ticket.customerId === parseInt(userId, 10));

    if (!userTickets.length) {
        return res.status(404).json({ error: 'No tickets found.' });
    }

    res.status(200).json({
        message: 'User tickets fetched',
        tickets: userTickets
    });
});




router.get('/:customerId', (req, res) => {
    console.log("Received headers in microservice:", req.headers); 
    const role = req.headers['user-role'];  
    const { customerId } = req.params;  

    if (!role) {
        return res.status(400).json({ error: 'Role is missing from the headers.' });
    }

    if (role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    const customerTickets = tickets.filter(ticket => ticket.customerId === parseInt(customerId, 10));

    if (!customerTickets.length) {
        return res.status(404).json({ error: 'No tickets found for this customer.' });
    }

    res.status(200).json(customerTickets);
});

router.put('/:ticketId', (req, res) => {
    const ticketId = parseInt(req.params.ticketId, 10); 
    const { status } = req.body;  
    const role = req.headers['user-role'];  

    console.log("Role:", role);
    console.log("Ticket ID:", ticketId);
    console.log("Request Body:", req.body);
    
    const ticket = tickets.find(t => t.id === ticketId);

    if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found.' });
    }

    if (!role) {
        return res.status(400).json({ error: 'Role is missing in the request headers.' });
    }

    if (role === 'admin') {
        if (status) {
            ticket.status = status;  
            return res.status(200).json({ message: 'Ticket status updated successfully', ticket });
        } else {
            return res.status(400).json({ error: 'Status is required for admin updates.' });
        }
    }

    return res.status(403).json({ error: 'Access denied. Only admins can update the status.' });
});


router.delete('/:ticketId', (req, res) => {
    const ticketId = parseInt(req.params.ticketId, 10); 
    const role = req.headers['user-role'];
    const userId = req.headers['user-id'];  

    console.log("Role:", role);
    console.log("Ticket ID:", ticketId);
    console.log("User ID:", userId);

    if (!role || !userId) {
        return res.status(400).json({ error: 'Role or User ID is missing in the request headers.' });
    }

    const ticketIndex = tickets.findIndex(t => t.id === ticketId);

    if (ticketIndex === -1) {
        return res.status(404).json({ error: 'Ticket not found.' });
    }

    const ticket = tickets[ticketIndex];

    if (role === 'admin') {
        tickets.splice(ticketIndex, 1);
        return res.status(200).json({ message: 'Ticket deleted successfully' });
    }

    if (role === 'user' && ticket.customerId === parseInt(userId, 10)) {
        tickets.splice(ticketIndex, 1);
        return res.status(200).json({ message: 'Your ticket has been deleted successfully.' });
    }

    return res.status(403).json({ error: 'You can only delete your own tickets.' });
});


module.exports = router;
