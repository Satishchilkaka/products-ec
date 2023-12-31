const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const secretKey = process.env.SECRET_KEY;

console.log('secretKey', secretKey)
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Middleware to verify JWT token from the Authorization header
function authenticateToken(req, res, next) {
  const token = req.header('Authorization');
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Verify the JWT token
  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.user = user;
    next();
  });
}

app.get('/v1/products', async (req, res) => {
// app.get('/v1/products', authenticateToken, async (req, res) => {

  try {
    await client.connect();
    const db = client.db('products');
    const collection = db.collection('grocery_products');

    const products = await collection.find({}).toArray();
    client.close();

    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


module.exports = app;
