// const express = require('express');
// const { MongoClient } = require('mongodb');
// require('dotenv').config();
// const app = express();

// const uri = process.env.MONGODB_URI;
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


// app.post('/v1/login', async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     await client.connect();
//     const db = client.db('users'); 
//     const usersCollection = db.collection('login'); 

//     const user = await usersCollection.findOne({ username, password });

//     if (user) {
//       res.json({ message: 'Login successful' });
//     } else {
//       res.status(401).json({ message: 'Invalid credentials' });
//     }
//   } catch (error) {
//     console.error('Error connecting to MongoDB:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   } finally {
//     await client.close();
//   }
// });


// module.exports = app;



const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const secretKey = 'your-secret-key';
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Login route
app.post('/v1/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    await client.connect();
    const db = client.db('users'); 
    const usersCollection = db.collection('login'); 

    const user = await usersCollection.findOne({ username, password });

    if (user) {
      const token = jwt.sign({ id: user.id, role: user.role }, secretKey);
      res.json({ message: 'Login successful', token });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await client.close();
  }
});

// Protected route
app.get('/v1/protected', (req, res) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token verification failed' });
    }

    // Access control logic based on user role
    if (decoded.role === 'admin') {
      res.json({ message: 'Welcome, admin user!' });
    } else {
      res.json({ message: 'Welcome, regular user!' });
    }
  });
});

module.exports = app;
