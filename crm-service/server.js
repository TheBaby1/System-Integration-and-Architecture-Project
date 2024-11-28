const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());


app.get('/api/customers', (res, req) => {
    res.status(200).json([
        { id: 1, name: 'Nichole Alburo', email: 'vine@gmail.com' },
        { id: 2, name: 'Sareljohn Pebida', email: 'john@hotmail.com' },
        { id: 3, name: 'Nikko Ensomo', email: 'nikko@yahoo.com' }
    ])
})


app.post('/api/customers', (req, res) => {

    try {
        const { name, enail } = req.body;
        const newCustomer = { id: Date.now(), name, email };
        res.status(201).json(newCustomer);
    } catch (error) {
        res.status(500).json( 'Internal Server Error' );
    }
})

app.listen(3001, () => {
    console.log('CRM Service running on port 3001');
})