const express = require("express");
const { S3Client, ListObjectsCommand } = require("@aws-sdk/client-s3");
const { MongoClient } = require('mongodb');
const app = express();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});


app.get('/v1/get-documents', async (req, res) => {
    try {
        // Fetch document metadata from MongoDB.
        const db = client.db('users_documents');
        const productsCollection = db.collection('documents');
        const documents = await productsCollection.find({}).toArray();

        // Map documents to include both MongoDB metadata and AWS S3 image URLs.
        const documentsWithUrls = documents.map((document) => ({
            name: document.name,
            category: document.category,
            imageURL: document.imageURL,
            uploadDate: document.uploadDate, 
            id: document._id

        }));

        res.json(documentsWithUrls);
    } catch (error) {
        console.error('Error fetching document metadata from MongoDB:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

module.exports = app;
