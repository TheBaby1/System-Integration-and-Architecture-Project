const express = require('express');
const axios = require('axios');
const router = express.Router();

// GET request to retrieve Products
router.get('/', async (req, res) => {
    const response = await axios.get('http://localhost:3002/api/inventory');
    res.status(200).json(response.data);
});

// POST request to Create a new Product
router.post('/', async (req, res) => {

    try {
        const newProduct = req.body;
        const response = await axios.post('http://localhost:3002/api/inventory', newProduct);
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Failed to Create New Product', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// PUT request to Update a Product by ID
router.put('/:id', async (req, res) => {

    try {
        const productId = req.params.id;
        const updatedProductData = req.body;

        const response = await axios.put(`http://localhost:3002/api/inventory/${productId}`, updatedProductData);
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Failed to Update Product', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// DELETE request to Delete a Product by ID 
router.delete('/:id', async (req, res) => {

    try {
        const productId = req.params.id;
        const response  = await axios.delete(`http://localhost:3002/api/inventory/${productId}`);

        res.status(200).json(response.data);
    } catch (error) {
        console.error('Failed to Delete Product', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})


module.exports = router;