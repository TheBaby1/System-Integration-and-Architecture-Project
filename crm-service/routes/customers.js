const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

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

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                error: true,
                message: 'Please provide name, email, and password.',
            });
        }

        const existingCustomer = customers.find(c => c.email.toLowerCase() === email.toLowerCase());
        if (existingCustomer) {
            return res.status(400).json({
                error: true,
                message: 'Email is already in use.',
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
            customer: newCustomer,
        });
    } catch (error) {
        console.error('Error registering customer:', error);
        res.status(500).json({
            error: true,
            message: 'An error occurred while registering the customer.',
        });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: true,
                message: 'Please provide email and password.',
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const customer = customers.find(c => c.email.toLowerCase().trim() === normalizedEmail);

        if (!customer) {
            return res.status(404).json({
                error: true,
                message: 'User does not exist.',
            });
        }

        const isPasswordValid = await bcrypt.compare(password, customer.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: true,
                message: 'Invalid email or password.',
            });
        }

        const token = jwt.sign({ id: customer.id, role: customer.role }, 'your_secret_key', { expiresIn: '1h' });

        res.status(200).json({
            success: true,
            message: 'Login successful.',
            token,
            customer,
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({
            error: true,
            message: 'An error occurred during login.',
        });
    }
});



// CRUD Routes for customers
router.get('/', (req, res) => {
    const { 'user-role': role, 'user-id': userId } = req.headers;

    if (!role || !userId) {
        return res.status(400).json({ error: 'Role or User ID is missing in the request headers.' });
    }

    if (role === 'admin') {
        try {
            res.status(200).json(customers);
        } catch (error) {
            console.error('Error fetching customers:', error);
            res.status(500).json({
                error: true,
                message: 'An error occurred while fetching customers.',
            });
        }
    } else {
        const customer = customers.find(c => c.id === parseInt(userId));
        
        if (!customer) {
            return res.status(404).json({
                error: true,
                message: 'Customer not found.',
            });
        }

        res.status(200).json(customer);
    }
});



// router.get('/:id', (req, res) => {
//     try {
//         const customer = customers.find(c => c.id === parseInt(req.params.id));
//         if (!customer) {
//             return res.status(404).json({
//                 error: true,
//                 message: 'Customer not found.',
//             });
//         }
//         res.status(200).json(customer);
//     } catch (error) {
//         console.error('Error fetching customer:', error);
//         res.status(500).json({
//             error: true,
//             message: 'An error occurred while fetching the customer.',
//         });
//     }
// });

router.put('/:id', (req, res) => {
    const { 'user-role': role, 'user-id': userId } = req.headers;
    const { id } = req.params;  


    if (!role || !userId) {
        return res.status(400).json({ error: 'Role or User ID is missing in the request headers.' });
    }


    const customer = customers.find(c => c.id === parseInt(id));
    if (!customer) {
        return res.status(404).json({
            error: true,
            message: 'Customer not found.',
        });
    }

    if (role !== 'admin' && parseInt(userId) !== customer.id) {
        return res.status(403).json({ error: 'Access denied. You can only update your own information.' });
    }

    const { name, email, password } = req.body;
    if (name) customer.name = name;
    if (email) customer.email = email;
    if (password) customer.password = bcrypt.hashSync(password, 10);

    res.status(200).json({
        success: true,
        message: 'Customer successfully updated.',
        customer,
    });
});


router.delete('/:id', (req, res) => {
    const { 'user-role': role, 'user-id': userId } = req.headers;
    const customerId = req.params.id;

    if (!role || !userId) {
        return res.status(400).json({ error: 'Role or User ID is missing in the request headers.' });
    }

    if (role !== 'admin' && userId !== customerId) {
        return res.status(403).json({ error: 'Access denied: You can only delete your own data or be an admin.' });
    }

    try {
        const customerIndex = customers.findIndex(c => c.id === parseInt(customerId));
        if (customerIndex === -1) {
            return res.status(404).json({
                error: true,
                message: 'Customer not found.',
            });
        }

        customers.splice(customerIndex, 1);
        res.status(200).json({
            success: true,
            message: 'Customer successfully deleted.',
        });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({
            error: true,
            message: 'An error occurred while deleting the customer.',
        });
    }
});


module.exports = router;
