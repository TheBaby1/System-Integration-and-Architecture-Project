const express = require('express');
const router = express.Router();

let tickets = [];
let ticketIdCounter = 1; // Ticket ID counter (will reset on service restart)

// Create a new ticket (customerId will be attached automatically by the gateway)
router.post('/', (req, res) => {
    const { customerId, issue } = req.body; // The body must contain the 'issue'

    // Check if the issue is provided
    if (!issue) {
        return res.status(400).json({ error: 'Issue is required.' });
    }

    // If customerId is missing, it's an internal issue (should be attached by the gateway)
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
    const role = req.headers['user-role'];  // Get user role from headers
    const userId = req.headers['user-id'];  // Get user ID from headers

    if (!role || !userId) {
        return res.status(400).json({ error: 'User role or ID missing in the request headers' });
    }

    // If user role is admin, return all tickets
    if (role === 'admin') {
        return res.status(200).json({
            message: 'All tickets fetched',
            tickets: tickets  // Return the actual tickets
        });
    }

    // For regular users, filter tickets by customerId (userId)
    const userTickets = tickets.filter(ticket => ticket.customerId === parseInt(userId, 10));

    // If no tickets are found for the user, return 404
    if (!userTickets.length) {
        return res.status(404).json({ error: 'No tickets found.' });
    }

    // Return the filtered tickets for the user
    res.status(200).json({
        message: 'User tickets fetched',
        tickets: userTickets
    });
});




router.get('/:customerId', (req, res) => {
    console.log("Received headers in microservice:", req.headers);  // Log all headers
    const role = req.headers['user-role'];  // Access 'user-role' header (case-insensitive)
    const { customerId } = req.params;  // Extract customerId from URL

    // Ensure the role is available
    if (!role) {
        return res.status(400).json({ error: 'Role is missing from the headers.' });
    }

    // If the role is not admin, deny access
    if (role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    // Admin can fetch the specific customer's tickets
    const customerTickets = tickets.filter(ticket => ticket.customerId === parseInt(customerId, 10));

    // If no tickets are found, return 404 error
    if (!customerTickets.length) {
        return res.status(404).json({ error: 'No tickets found for this customer.' });
    }

    // Return the tickets for the specific customer
    res.status(200).json(customerTickets);
});

// Update a ticket
router.put('/:ticketId', (req, res) => {
    const ticketId = parseInt(req.params.ticketId, 10);  // Get the ticket ID from the URL
    const { issue, status } = req.body;  // Get the issue and status from the request body
    const role = req.headers['user-role'];  // Get the role from the request headers
    const ticket = tickets.find(t => t.id === ticketId);  // Find the ticket by ID

    if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found.' });
    }

    // Check if the role is admin or user and process accordingly
    if (role === 'admin') {
        // Admin can update both status and issue
        if (status) {
            ticket.status = status;
        }
        if (issue) {
            ticket.issue = issue;
        }
        return res.status(200).json({ message: 'Ticket updated successfully', ticket });
    }

    if (role === 'user') {
        // User can only update the issue
        if (issue) {
            ticket.issue = issue;
            return res.status(200).json({ message: 'Ticket issue updated successfully', ticket });
        } else {
            return res.status(400).json({ error: 'Issue is required for users.' });
        }
    }

    // If role is neither admin nor user
    return res.status(400).json({ error: 'Invalid role. Admin can update status and issue, users can only update the issue.' });
});



// Delete a ticket (based on ticketId)
router.delete('/:ticketId', (req, res) => {
    const ticketId = parseInt(req.params.ticketId, 10);
    const index = tickets.findIndex(t => t.id === ticketId);

    if (index === -1) {
        return res.status(404).json({ error: 'Ticket not found.' });
    }

    tickets.splice(index, 1);
    res.status(200).json({ message: 'Ticket deleted successfully' });
});

module.exports = router;
