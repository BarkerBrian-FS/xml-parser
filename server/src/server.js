require("dotenv").config();
const {
  analyzeDocument,
  askAboutDocument,
} = require("./services/aiService.js");
const express = require("express");
const cors = require("cors");
const { analyzeXML } = require("./services/xmlService");
const connectDB = require("./config/db");
const Document = require("./models/Documents.js");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.text({ type: "application/xml" }));

const PORT = 5000;
connectDB(process.env.MONGO_URI);

/* GET Routes */
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

/* POST Routes */
app.post("/api/xml/ask", async (req, res) => {
  console.log("Hit ask route");
  try {
    const { documentId, question } = req.body;

    const doc = await Document.findById(documentId);

    if (!doc) {
      return res.status(404).json({
        message: "Document Not Found",
      });
    }

    const answer = await askAboutDocument(
      doc.data,
      doc.metadata,
      doc.aiAnalysis,
      question,
    );

    res.json({
      answer,
    });
  } catch (error) {
    console.error("ASK ROUTE ERROR", error);
    res.status(500).json({
      message: "Failed to answer question",
    });
  }
});

app.post("/api/xml/analyze", async (req, res) => {
  try {
    const result = analyzeXML(req.body);

    if (result.valid === false) {
      return res.status(400).json(result);
    }
    const analysis = await analyzeDocument(result.data, result.metadata);
    console.log("POST route reached");
    console.log(typeof req.body);
    console.log(req.body);

    console.log("Analysis result:");
    console.log(JSON.stringify(analysis, null, 2));

    const document = await Document.create({
      ...result,
      aiAnalysis: analysis,
    });

    console.log("Saved document:");
    console.log(JSON.stringify(document, null, 2));

    res.json(document);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to save document",
    });
  }
});
/* PATCH Routes */
app.patch("/api/xml/documents/:id", async (req, res) => {
  try {
    const { title } = req.body;

    if (typeof title !== "string") {
      return res.status(400).json({
        message: "Title must be a string",
      });
    }

    const document = await Document.findByIdAndUpdate(
      req.params.id,
      { title: title.trim() },
      { new: true, runValidators: true },
    );

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    res.json(document);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update document",
    });
  }
});

/* DELETE Routes */
app.delete("/api/xml/documents/:id", async (req, res) => {
  console.log("Hit delete route");
  try {
    const document = await Document.findByIdAndDelete(req.params.id);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }
    res.json({
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete document",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Sever is running on port ${PORT}`);
});
