const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    originalXml: {
      type: String,
      required: true,
    },

    data: {
      type: Object,
      required: true,
    },

    metadata: {
      type: Object,
      required: true,
    },
    aiAnalysis: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Document = mongoose.model("Document", documentSchema);

module.exports = Document;
