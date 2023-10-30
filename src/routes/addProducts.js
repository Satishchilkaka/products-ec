
const { v4: uuidv4 } = require('uuid');
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

// // Connect to MongoDB
// client.connect().then(() => {
//   console.log('Connected to MongoDB');
// }).catch((err) => {
//   console.error('Error connecting to MongoDB:', err);
// });

app.use(express.json());

function generateShortURL() {
    return uuidv4(); 
  }

// API endpoint to receive product data and generate/store short URLs
app.post('/v1/new-products/products', async (req, res) => {
  const { name, category, price, quantity, imageURL } = req.body;

  // Generate a short URL
  const shortURL = generateShortURL(imageURL);

  // Store the short URL and other product data in MongoDB
  try {
    await client.connect();
    const db = client.db('products'); 
    const productsCollection = db.collection('grocery_products'); 

    const shortURL = generateShortURL();

    // Store the short URL and other product data in MongoDB
    await productsCollection.insertOne({
      name,
      category,
      price,
      quantity,
      imageURL,
      shortURL, // Store the short URL in MongoDB
    });

    res.status(201).json({ shortURL });
  } catch (error) {
    console.error('Error inserting product:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await client.close();
  }
});

module.exports = app;
