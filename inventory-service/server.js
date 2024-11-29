const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());


app.get('/api/inventory', (req, res) => {
    res.status(200).json([
        { id: 1, product: 'Laptop', stock: 25},
        { id: 2, product: 'Phone', stock: 45}
    ])
})


app.put('/api/inventory/:id', (req, res) => {

    try {
        const { id } = req.params;
        const { stock } = req.body;
        res.status(200).json({ id, stock });
    } catch (error) {
        console.error('Failed to create inventory:', error);
        res.status(500).json( 'Internal Service Error' );
    }
})


app.listen(3002, () => {
    console.log('Inventory Service running on port 3002');
})