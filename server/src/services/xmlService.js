const { XMLParser } = require("fast-xml-parser");

const parser = new XMLParser();

function analyzeXML(xml) {
  const parsedData = parser.parse(xml);

  const rootElement = Object.keys(parsedData)[0];

  return {
    originalXml: xml,
    data: parsedData,
    metadata: {
      rootElement,
    },
  };
}

module.exports = { analyzeXML };
