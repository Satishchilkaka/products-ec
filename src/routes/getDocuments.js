const express = require("express");
const { S3Client, ListObjectsCommand } = require("@aws-sdk/client-s3");
const app = express();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

app.get("/v1/get-documents", async (req, res) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
  };

  try {
    const listObjectsCommand = new ListObjectsCommand(params);
    const data = await s3Client.send(listObjectsCommand);

    const documents = data.Contents.map((object) => {
      const { Key, LastModified } = object;
      const documentUrl = `https://${params.Bucket}.s3.amazonaws.com/${Key}`;

      return {
        name: Key,
        uploadDate: LastModified,
        url: documentUrl,
      };
    });

    res.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

module.exports = app;
