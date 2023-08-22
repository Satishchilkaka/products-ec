const express = require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const app = express();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });



app.post('/v1/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    await client.connect();
    const db = client.db('users'); 
    const usersCollection = db.collection('login'); 

    const user = await usersCollection.findOne({ username, password });

    if (user) {
      res.json({ message: 'Login successful' });
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


module.exports = app;