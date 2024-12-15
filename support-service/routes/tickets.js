const express = require('express');
const router = express.Router();

let tickets = [];
let ticketIdCounter = 1;

// Create Ticket
router.post('/', (req, res) => {
    const { 'user-role': role, 'user-id': userId } = req.headers;  
    const { issue, customerId } = req.body;  

    console.log('Received Headers:', req.headers);

    if (role !== 'customer') {
        return res.status(403).json({ error: 'Only customers can create tickets.' });
    }

    if (!issue || !customerId) {
        return res.status(400).json({ error: 'Issue and customerId are required.' });
    }

    if (parseInt(customerId, 10) !== parseInt(userId, 10)) {
        return res.status(403).json({ error: 'You can only create tickets for your own account.' });
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



// Get All Tickets or User's Tickets
router.get('/', (req, res) => {
    const { 'user-role': role, 'user-id': userId } = req.headers;

    if (!role || !userId) {
        return res.status(400).json({ error: 'User role or ID is missing in the request headers.' });
    }

    if (role === 'admin') {
        return res.status(200).json({ message: 'All tickets fetched', tickets });
    }

    const userTickets = tickets.filter(ticket => ticket.customerId === parseInt(userId, 10));
    return res.status(200).json({ message: 'User tickets fetched', tickets: userTickets });
});

// CRM Service Code
router.get('/:customerId', (req, res) => {
    const { 'user-role': role, 'user-id': userId } = req.headers;
    const { customerId } = req.params;

    if (!role || !userId) {
        return res.status(400).json({ error: 'Role or User ID is missing in the request headers.' });
    }

    const parsedCustomerId = parseInt(customerId, 10);

    if (role === 'admin') {
        const customerTickets = tickets.filter(ticket => ticket.customerId === parsedCustomerId);
        return res.status(200).json({ message: 'Customer tickets fetched', tickets: customerTickets });
    }

    if ((role === 'user' || role === 'customer') && parsedCustomerId === parseInt(userId, 10)) {
        const userTickets = tickets.filter(ticket => ticket.customerId === parsedCustomerId);
        return res.status(200).json({ message: 'Your tickets fetched', tickets: userTickets });
    }

    return res.status(403).json({ error: 'Access denied. You can only access your own tickets.' });
});



router.put('/:ticketId', (req, res) => {
    const { 'user-role': role, 'user-id': userId } = req.headers;
    const { status } = req.body;
    const ticketId = parseInt(req.params.ticketId, 10);

    if (!role || !status) {
        return res.status(400).json({ error: 'Role and status are required.' });
    }

    const ticket = tickets.find(t => t.id === ticketId);

    if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found.' });
    }

    // If the user is an admin, allow them to update the status
    if (role === 'admin') {
        ticket.status = status;
        return res.status(200).json({ message: 'Ticket updated successfully', ticket });
    }

    return res.status(403).json({ error: 'Access denied. Only admins can update ticket status.' });
});

router.delete('/:ticketId', (req, res) => {
    const { 'user-role': role, 'user-id': userId } = req.headers;
    const ticketId = parseInt(req.params.ticketId, 10);  

    if (!role || !userId) {
        return res.status(400).json({ error: 'Role or User ID is missing in the request headers.' });
    }

    const ticketIndex = tickets.findIndex(t => t.id === ticketId);

    if (ticketIndex === -1) {
        return res.status(404).json({ error: 'Ticket not found.' });
    }

    const ticket = tickets[ticketIndex];

    if (role === 'admin' || (role === 'customer' && ticket.customerId === parseInt(userId, 10))) {
        tickets.splice(ticketIndex, 1);
        return res.status(200).json({ message: 'Ticket deleted successfully' });
    }

    return res.status(403).json({ error: 'You can only delete your own tickets.' });
});


module.exports = router;
