const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());


app.post('/api/tickets', (req, res) => {
    const { customerId, issue } = req.body;
    const newTicket = { id: Date.now(), customerId, issue, status: 'open' };
    res.status(201).json(newTicket);
});


app.get('/api/tickets/:customerId', (req, res) => {

    try {
        const { customerId } = req.params;
    
        res.status(200).json([
          { ticketId: 1, customerId, issue: 'Issue with order', status: 'open' },
        ]);
    } catch (error) {
        res.status(500).json( 'Internal Server Error' );
    }
    
});


app.listen(3003, () => {
    console.log('Support Service listening on port 3003');
})