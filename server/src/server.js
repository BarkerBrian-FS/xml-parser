require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { analyzeXML } = require("./services/xmlService");
const connectDB = require("./config/db");

const app = express();
app.use(cors());
app.use(express.text({ type: "application/xml" }));

const PORT = 5000;
connectDB();
app.get("/api/health", (req, res) => {
  res.json({
    message: "API is running",
  });
});

app.post("/api/xml/analyze", (req, res) => {
  const result = analyzeXML(req.body);

  console.log("POST route reached");

  console.log(typeof req.body);
  console.log(req.body);

  console.log(result);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Sever is running on port ${PORT}`);
});
