const express = require('express');
const router = express.Router();

let products = [];
let nextProductId = 1;

// Fetch all products
router.get('/', (req, res) => {
    res.status(200).json(products);
});

// Create new product (admin only)
router.post('/', (req, res) => {
    const { name, price, quantity } = req.body;
    if (!name || !price || !quantity) {
        return res.status(400).json({ message: 'Complete all fields! (Name, Price, Quantity)' });
    }
    if (products.find(p => p.name.toLowerCase() === name.toLowerCase())) {
        return res.status(400).json({ message: 'Product name already exists!' });
    }
    const newProduct = { id: nextProductId++, name, price, quantity };
    products.push(newProduct);
    res.status(201).json({ message: 'Successfully added new product!' });
});

// Update product by ID (admin only)
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, price, quantity } = req.body;
    const product = products.find(p => p.id == id);

    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    if (name) product.name = name;
    if (price) product.price = price;
    if (quantity) product.quantity = quantity;

    res.status(200).json({ message: 'Product successfully updated' });
});

// Delete product by ID (admin only)
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const index = products.findIndex(p => p.id == id);

    if (index === -1) {
        return res.status(404).json({ message: 'Product not found' });
    }

    products.splice(index, 1);
    res.status(200).json({ message: 'Product successfully deleted' });
});

module.exports = router;
