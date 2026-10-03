require("dotenv").config();
const {
  analyzeDocument,
  askAboutDocument,
} = require("./services/aiService.js");
const express = require("express");
const cors = require("cors");
const { analyzeXML } = require("./services/xmlService");
const connectDB = require("./config/db");
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const Document = require("./models/Documents.js");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.text({ type: "application/xml" }));

const PORT = 5000;
connectDB(process.env.MONGO_URI);

/* Format names for pdf  */
function formatStatisticName(name) {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}

/* Helper for pdf section headers */
function addSectionHeader(pdf, title) {
  pdf
    .moveDown(1)
    .fontSize(15)
    .font("Helvetica-Bold")
    .fillColor("#1f2937")
    .text(title);

  pdf
    .moveDown(0.3)
    .strokeColor("#e5e7eb")
    .lineWidth(0.5)
    .moveTo(50, pdf.y)
    .lineTo(562, pdf.y)
    .stroke();

  pdf.fillColor("#000000");
}
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

app.get("/api/xml/documents/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid document Id",
      });
    }

    const document = await Document.findById(req.params.id);

    if (!document) {
      res.status(404).json({
        message: "Document not found",
      });
    }
    res.json(document);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to retrieve document",
    });
  }
});

/* Export Routes PDF JSON and XML */
app.get("/api/xml/documents/:id/pdf", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid document Id",
      });
    }
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }
    const pdf = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      `attachment; filname-"document-${document._id}.pdf"`,
    );

    pdf.pipe(res);

    pdf.fontSize(20).font("Helvetica-Bold").text("AI Data Intelligence Report");

    pdf
      .fontSize(14)
      .font("Helvetica")
      .text(
        `Document: ${document.title || document.metadata?.rootElement || "Untitled"}`,
      );

    pdf
      .fontSize(12)
      .fillColor("#666666")
      .text(`Document Type: ${document.aiAnalysis?.documentType || "Unknown"}`);

    pdf.fillColor("#000000");

    pdf
      .moveDown(0.8)
      .strokeColor("#d1d5db")
      .lineWidth(1)
      .moveTo(50, pdf.y)
      .lineTo(562, pdf.y)
      .stroke();

    addSectionHeader(pdf, "Executive Summary");

    pdf
      .moveDown(0.5)
      .fontSize(11)
      .text(document.aiAnalysis?.summary || "No summary available.");

    addSectionHeader(pdf, "Key Entities");

    document.aiAnalysis?.entities.forEach((entity) => {
      pdf.moveDown(0.5).fontSize(12).text(`${entity.name} (${entity.type})`);

      pdf.fontSize(10).text(entity.description || "No description available.");
    });

    addSectionHeader(pdf, "Insights");

    document.aiAnalysis?.insights?.forEach((insight) => {
      pdf.moveDown(0.5).fontSize(11).text(`- ${insight}`);
    });

    addSectionHeader(pdf, "Warnings");

    document.aiAnalysis?.warnings?.forEach((warning) => {
      pdf.moveDown(0.5).fontSize(11).text(`- ${warning}`);
    });

    addSectionHeader(pdf, "Statistics");

    document.aiAnalysis?.statistics?.forEach((statistic) => {
      pdf
        .moveDown(0.5)
        .fontSize(12)
        .text(
          `${formatStatisticName(statistic.name)}: ${statistic.value}${statistic.unit ? ` ${statistic.unit}` : ""}`,
        );
      pdf.fontSize(10).text(statistic.description || "");
    });

    addSectionHeader(pdf, "Suggested Questions");

    document.aiAnalysis?.suggestedQuestions?.forEach((question) => {
      pdf.moveDown(0.5).fontSize(11).text(`- ${question}`);
    });

    const range = pdf.bufferedPageRange();

    for (let i = range.start; i < range.start + range.count; i++) {
      pdf.switchToPage(i);
    }

    pdf.end();
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Faidled to generate PDF",
    });
  }
});

app.get("/api/xml/documents/:id/json", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid document Id",
      });
    }
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    const exportData = {
      title: document.title || document.metadata?.rootElement || "Untitled",

      documentType: document.aiAnalysis?.documentType || "Unknown",

      summary: document.aiAnalysis?.summary || "",

      entities: document.aiAnalysis?.entities || [],

      insights: document.aiAnalysis?.insights || [],

      warnings: document.aiAnalysis?.warnings || [],

      statistics: document.aiAnalysis?.statistics || [],

      suggestedQuestions: document.aiAnalysis?.suggestedQuestions || [],
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="document-${document._id}.json"`,
    );

    res.send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to export JSON",
    });
  }
});

app.get("/api/xml/documents/:id/xml", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid document Id",
      });
    }
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filname="document-${document._id}.xml"`,
    );

    res.send(document.originalXml);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to export XML",
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

    const existingDocument = await Document.findOne({
      originalXml: req.body,
    });
    if (existingDocument) {
      return res.status(409).json({
        message: "This XML document has already been analyzed",
      });
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
