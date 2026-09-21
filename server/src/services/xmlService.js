const { XMLParser } = require("fast-xml-parser");

const parser = new XMLParser();

function analyzeXml(xml) {
  const parsedData = parser.parse(xml);

  return parsedData;
}

module.exports = { analyzeXml };
