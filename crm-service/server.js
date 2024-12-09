const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let customers = [];

// Route for Retrieving all customers
app.get('/api/customers', (req, res) => {

    try {
        res.status(200).json(customers);
    } catch (error) {
        console.log('Failed to fetch customers:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
    
})

// Route for Creating a Customer
app.post('/api/customers', (req, res) => {

    try {
        const { name, email } = req.body;
        const newCustomer = { id: Date.now(), name, email };

        if (!name && !email) {
            return res.status(400).json({ message: 'Complete all fields! (Name, Email)' });
        }

        customers.push(newCustomer);

        res.status(201).json({ message: 'Succesfully Added New Customer' });
    } catch (error) {
        console.log('Failed to create customers:', error);
        res.status(500).json( 'Internal Server Error' );
    }
})

// Route for Retrieving customer by ID
app.get('/api/customers/:id', (req, res) => {

    try {
        const customerId = parseInt(req.params.id);
        const customer = customers.find(c => c.id === customerId);

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.status(200).json(customer);
    } catch (error) {
        console.error('Failed to Retrieve Customers', error);
    }
})

// Route for Updating Customers by ID
app.put('/api/customers/:id', (req, res) => {

    try {
        const customerId = parseInt(req.params.id);
        const { name, email } = req.body;
        const customer = customers.find(c => c.id === customerId);

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found!'});
        }

        customer.name = name;
        customer.email = email;
        res.status(200).json({ message: 'Customer Successfully Updated' });
    } catch (error) {
        console.error('Failed to Update Customer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// Route for Deleting a Customer by ID
app.delete('/api/customers/:id', (req, res) => {

    try {
        const customerId = parseInt(req.params.id);
        const index = customers.findIndex(c => c.id === customerId);

        if (index === -1) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        customers.splice(index, 1);
        res.status(200).json({ message: 'Customer Successfully Deleted' });
    } catch (error) {
        console.error('Failed to Delete Customer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})


app.listen(3001, () => {
    console.log('CRM Service running on port 3001');
})