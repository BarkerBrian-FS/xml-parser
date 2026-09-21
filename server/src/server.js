const express = require("express");
const cors = require("cors");
const { XMLParser } = require("fast-xml-parser");
const { analyzeXml } = require("./xmlServiceservices/");

const app = express();
app.use(cors());
app.use(express.text({ type: "application/xml" }));

const parser = new XMLParser();

const PORT = 5000;

app.get("/api/health", (req, res) => {
  res.json({
    message: "API is running",
  });
});

app.post("/api/xml/analyze", (req, res) => {
  const parsedData = analyzeXml(req.body);

  console.log("POST route reached");

  console.log(typeof req.body);
  console.log(req.body);

  console.log(parsedData);
  res.json(parsedData);
});

app.listen(PORT, () => {
  console.log(`Sever is running on port ${PORT}`);
});
