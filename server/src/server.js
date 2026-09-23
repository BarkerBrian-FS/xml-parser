require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { analyzeXML } = require("./services/xmlService");
const connectDB = require("./config/db");
const Document = require("./models/Documents.js");

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
    const documents = await Document.find();

    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to retrieve documents",
    });
  }
});

app.post("/api/xml/analyze", async (req, res) => {
  try {
    const result = analyzeXML(req.body);

    if (result.valid === false) {
      return res.status(400).json(result);
    }

    console.log("POST route reached");
    console.log(typeof req.body);
    console.log(req.body);

    console.log("Analysis result:");
    console.log(result);

    const document = await Document.create(result);

    console.log("Saved document:");
    console.log(document);

    res.json(document);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to save document",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Sever is running on port ${PORT}`);
});
