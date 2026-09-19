const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.text());

const PORT = 5000;

app.get("/api/health", (req, res) => {
  res.json({
    message: "API is running",
  });
});

app.post("/api/xml/analyze", (req, res) => {
  console.log(req.body);

  res.json({
    message: "XML received",
  });
});

app.listen(PORT, () => {
  console.log(`Sever is running on port ${PORT}`);
});
