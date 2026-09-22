require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { analyzeXML } = require("./services/xmlService");
const connectDB = require("./config/db");
const document = require("./models/Documents.js");

const app = express();
app.use(cors());
app.use(express.text({ type: "application/xml" }));

const PORT = 5000;
connectDB(process.env.MONGO_URI);

app.get("/api/health", (req, res) => {
  res.json({
    message: "API is running",
  });
});

app.get("/api/xml/documents", async (req, res) => {
  try {
    const documents = await document.find();

    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to retrieve documents",
    });
  }
});

app.post("/api/xml/analyze", async (req, res) => {
  console.log("POST route reached");

  try {
    const result = analyzeXML(req.body);

    const document = await document.create(result);

    console.log(document);

    res.json(document);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to save document",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Sever is running on port ${PORT}`);
});
