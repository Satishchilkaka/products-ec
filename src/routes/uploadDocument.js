

const express = require("express");
const { S3Client, PutObjectCommand, CopyObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");

const app = express();

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
    res.send('File uploaded successfully');
  });
  

// update the document name
app.put('/v1/update-document/:key', async (req, res) => {
    const { key } = req.params;
    const { newDocumentName } = req.body;
  
    if (!newDocumentName) {
      return res.status(400).json({ error: "New document name is required." });
    }
  
    const originalFileExtension = path.extname(key);
    const newKey = newDocumentName + originalFileExtension;
  
    try {
      const copyObjectParams = {
        CopySource: `${process.env.AWS_BUCKET_NAME}/${key}`,
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: newKey,
      };
      await s3Client.send(new CopyObjectCommand(copyObjectParams));
  
      const deleteObjectParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      };
      await s3Client.send(new DeleteObjectCommand(deleteObjectParams));
  
      res.status(200).json({ message: "Document updated successfully." });
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(400).json({ error: "Failed to update the document." });
    }
  });
  

//  delete the document
app.delete('/v1/delete-document/:key', async (req, res) => {
  const { key } = req.params;

  try {
    const deleteObjectParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    };
    await s3Client.send(new DeleteObjectCommand(deleteObjectParams));

    res.status(200).json({ message: "Document deleted successfully." });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(400).json({ error: "Failed to delete the document." });
  }
});

module.exports = app;

