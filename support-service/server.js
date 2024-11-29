const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());


app.post('/api/tickets', (req, res) => {
    try {
        const { customerId, issue } = req.body;

        if (!customerId || !issue) {
            return res.status(400).json({ error: 'customerId and issue are required' });
        }
        const newTicket = { id: Date.now(), customerId, issue, status: 'open' };
        
        res.status(201).json(newTicket);
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



app.get('/api/tickets/:customerId', (req, res) => {

    try {
        const { customerId } = req.params;
    
        res.status(200).json([
          { ticketId: 1, customerId, issue: 'Issue with order', status: 'open' },
        ]);
    } catch (error) {
        console.error('Error getting ticket:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
    
});


app.listen(3003, () => {
    console.log('Support Service listening on port 3003');
})