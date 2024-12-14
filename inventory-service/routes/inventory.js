const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = 'your_secret_key'; 

let products = [];
let nextProductId = 1;  

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
        return res.status(401).json({ message: 'Access denied: No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user; 
        next();
    });
}

// Middleware to authorize only Admin users
function authorizeAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied: Admins only' });
    }
    next();
}

// Route for fetching products (no authentication required)
router.get('/', (req, res) => {
    try {
        res.status(200).json(products);
    } catch (error) {
        console.error('Failed to fetch products: ', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// Route for Creating Products (requires authentication and admin role)
router.post('/', authenticateToken, authorizeAdmin, (req, res) => {
    try {
        const { name, price, quantity } = req.body;

        const existingProduct = products.find(p => p.name.toLowerCase() === name.toLowerCase());

        if (existingProduct) {
            return res.status(400).json({ message: 'Product name already exists!' });
        }

        if (!name || !price || !quantity) {
            return res.status(400).json({ message: 'Complete All Fields! (Name, Price, Quantity)' });
        }

        const newProduct = { id: nextProductId, name, price, quantity };
        products.push(newProduct);

        nextProductId++; // Increment the ID counter for the next product

        res.status(201).json({ message: 'Successfully Added New Product!' });
    } catch (error) {
        console.error('Failed To Create Product', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// Route for Updating Products by ID (requires authentication and admin role)
router.put('/:id', authenticateToken, authorizeAdmin, (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const { name, price, quantity } = req.body;

        const product = products.find(p => p.id === productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not Found!' });
        }

        if (name) {
            const existingProduct = products.find(p => p.name.toLowerCase() === name.toLowerCase() && p.id !== productId);
            if (existingProduct) {
                return res.status(400).json({ message: 'Product name already exists!' });
            }
            product.name = name;
        }

        if (price) {
            product.price = price;
        }

        if (quantity) {
            product.quantity = quantity;
        }

        res.status(200).json({ message: 'Product Successfully Updated' });
    } catch (error) {
        console.error('Failed to Update Product', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// Route for Deleting Product by ID (requires authentication and admin role)
router.delete('/:id', authenticateToken, authorizeAdmin, (req, res) => {
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

module.exports = router;
