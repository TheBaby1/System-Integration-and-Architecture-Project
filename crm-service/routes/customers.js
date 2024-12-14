const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();


const JWT_SECRET = 'your_secret_key';  

let customerIdCounter = 2;
let customers = [
    {
        id: 1,
        name: 'Admin',
        email: 'admin@example.com',
        role: 'admin',
        password: bcrypt.hashSync('admin123', 10),
    },
];

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

// Route to Retrieve All Customers (Admin Only)
router.get('/', authenticateToken, (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }

        if (!customers || customers.length === 0) {
            return res.status(404).json({ message: 'No customers found' });
        }

        res.status(200).json(customers);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Register Route
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ 
                error: true, 
                message: 'Please provide name, email, and password' 
            });
        }

        const existingCustomer = customers.find(c => c.email.toLowerCase() === email.toLowerCase());
        if (existingCustomer) {
            return res.status(400).json({ 
                error: true, 
                message: 'Email is already in use' 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newCustomer = {
            id: customerIdCounter++, 
            name,
            email,
            role: 'customer',
            password: hashedPassword,
        };
        
        customers.push(newCustomer);

        res.status(201).json({ 
            success: true, 
            message: 'Customer successfully registered!', 
            customer: newCustomer 
        });
    } catch (error) {
        console.error(error); 
        res.status(500).json({ 
            error: true, 
            message: 'Internal Server Error. Please try again later.' 
        });
    }
});




// Route to Log In
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const customer = customers.find(c => c.email.toLowerCase().trim() === normalizedEmail);
        
        if (!customer) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, customer.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: customer.id, role: customer.role }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ message: 'Login successful', token, customer });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route to Retrieve Customer by ID
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const customerId = parseInt(req.params.id);
        const customer = customers.find(c => c.id === customerId);

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        if (req.user.role !== 'admin' && req.user.id !== customerId) {
            return res.status(403).json({ message: 'Access denied: You can only view your own account' });
        }

        res.status(200).json(customer);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route to Update a Customer by ID
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const customerId = parseInt(req.params.id);
        const { name, email, password } = req.body;
        const customer = customers.find(c => c.id === customerId);

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        if (req.user.id !== customerId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: You are not authorized to update this account' });
        }

        if (name) {
            customer.name = name;
        }
        if (email) {
            customer.email = email;
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            customer.password = hashedPassword;
        }

        res.status(200).json({ message: 'Customer successfully updated', customer });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Route to Delete a Customer by ID
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        const customerId = parseInt(req.params.id);
        const customerToDelete = customers.find(c => c.id === customerId);

        if (!customerToDelete) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        if (req.user.role !== 'admin' && req.user.id !== customerId) {
            return res.status(403).json({ message: 'Access denied: You are not authorized to delete this customer' });
        }

        const index = customers.findIndex(c => c.id === customerId);
        customers.splice(index, 1);

        res.status(200).json({ message: 'Customer successfully deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
