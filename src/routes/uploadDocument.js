

const express = require("express");
const { S3Client, PutObjectCommand, CopyObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");

const app = express();

const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');

const secretKey = process.env.SECRET_KEY;

console.log('secretKey', secretKey)
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const s3Storage = multerS3({
  s3: s3Client,
  bucket: process.env.AWS_BUCKET_NAME,
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    const originalname = file.originalname;
    cb(null, originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.jpeg', '.jpg', '.png', '.doc', '.docx', '.txt', '.zip'];
  const extname = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(extname)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

const upload = multer({ storage: s3Storage, fileFilter: fileFilter });
app.post('/v1/upload-document', upload.single('file'), async (req, res) => {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
  
    if (!req.body.category) {
      return res.status(400).send('Category is mandatory.');
    }
  
    const uploadedFileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${req.file.key}`;
  
    const document = {
      name: req.file.originalname,
      category: req.body.category,
      imageURL: uploadedFileUrl,
      uploadDate: new Date(),
    };
  
    try {
      // Insert the document metadata into MongoDB.
      const db = client.db('users_documents');
      const productsCollection = db.collection('documents');
      const result = await productsCollection.insertOne(document);
  
      if (result !== 0) {
        res.send('File uploaded successfully');
      } else {
        console.error('Failed to insert document metadata into MongoDB');
        res.status(500).send('Failed to store document metadata.');
      }
    } catch (error) {
      console.error('Error storing document metadata in MongoDB:', error);
      res.status(500).send('Error storing document metadata.');
    }
  });
  

// update the document name



app.put('/v1/update-document/:id', async (req, res) => {
    const { id } = req.params;
    const { newDocumentName } = req.body;

    if (!newDocumentName) {
        return res.status(400).json({ error: "New document name is required." });
    }

    try {
        // Update the document name in MongoDB.
        const db = client.db('users_documents');
        const productsCollection = db.collection('documents');

        // Find the document by its ID.
        const document = await productsCollection.findOne({ _id: new ObjectId(id) });

        if (document) {
            document.name = newDocumentName;

            // Save the updated document back to MongoDB.
            const result = await productsCollection.updateOne({ _id: new ObjectId(id) }, { $set: document });
            
            if (result.modifiedCount === 1) {
                res.status(200).json({ message: "Document updated successfully." });
            } else {
                res.status(500).json({ error: "Failed to update the document in MongoDB." });
            }
        } else {
            res.status(404).json({ error: "Document not found in MongoDB." });
        }
    } catch (error) {
        console.error("Error updating document:", error);
        res.status(400).json({ error: "Failed to update the document." });
    }
});




//  delete the document
app.delete('/v1/delete-document/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const db = client.db('users_documents');
        const productsCollection = db.collection('documents');

        // Find the document by its ID.
        const document = await productsCollection.findOne({ _id: new ObjectId(id) });

        if (document) {
            // Delete the document in MongoDB.
            const result = await productsCollection.deleteOne({ _id: new ObjectId(id) });

            if (result.deletedCount === 1) {
                // Delete the file from AWS S3.
                const deleteObjectParams = {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: document.name,
                };
                await s3Client.send(new DeleteObjectCommand(deleteObjectParams));

                res.status(200).json({ message: "Document deleted successfully." });
            } else {
                res.status(500).json({ error: "Failed to delete the document in MongoDB." });
            }
        } else {
            res.status(404).json({ error: "Document not found in MongoDB." });
        }
    } catch (error) {
        console.error("Error deleting document:", error);
        res.status(400).json({ error: "Failed to delete the document." });
    }
});


module.exports = app;

