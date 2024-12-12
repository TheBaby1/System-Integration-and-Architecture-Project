const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let products = [];

// Route for Retrieving all products
app.get('/api/inventory', (req, res) => {
    
    try {
        res.status(200).json(products);
    } catch (error) {
        console.error('Failed to fetch products: ', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// Route for Creating Products
app.post('/api/inventory', (req, res) => {

    try {
        const { name, price, quantity } = req.body;
        const newProduct = { id: Date.now(), name, price, quantity };

        if (!name && !price && !quantity) {
            return res.status(400).json({ message: 'Complete All Fields! (Name, Price, Quantity' });
        }

        products.push(newProduct);

        res.status(201).json({ message: 'Successfully Added New Product!' });
    } catch (error) {
        console.error('Failed To Create Product', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// Route for Updating Products by ID
app.put('/api/inventory/:id', (req, res) => {

    try {
        const productId = parseInt(req.params.id);
        const { name, price, quantity } = req.body;
        const product = products.find(p => p.id === productId);

        if (!product) {
            return res.status(404).json({ message: 'Prodcut not Found!' });
        }

        product.name = name;
        product.price = price;
        product.quantity = quantity;
        res.status(200).json({ message: 'Product Successfully Updated' });
    } catch (error) {
        console.error('Failed to Update Product', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// Route for Deleting Product by ID
app.delete('/api/inventory/:id', (req, res) => {

    try {
        const productId = parseInt(req.params.id);
        const index = products.findIndex(p => p.id === productId);

        if (index === -1) {
            return res.status(404).json({ error: 'Product Not Found' });
        }

        products.splice(index, 1);
        res.status(200).json({ message: 'Product Successfully Deleted' });
    } catch (error) {
        console.error('Failed to Delete Product', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

app.listen(3002, () => {
    console.log('Inventory Service running on port 3002');
})