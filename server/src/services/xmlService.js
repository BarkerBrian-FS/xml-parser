const { XMLParser } = require("fast-xml-parser");

const parser = new XMLParser();

function inspectObject(obj, elements) {
  const keys = Object.keys(obj);

  for (let i = 0; i < keys.length; i++) {
    const value = obj[keys[i]];

    elements.push(keys[i]);

    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        if (value[i] !== null && typeof value[i] === "object") {
          inspectObject(value[i], elements);
        }
      }
    } else if (value !== null && typeof value === "object") {
      inspectObject(value, elements);
    }
  }

  return elements;
}

function analyzeXML(xml) {
  const parsedData = parser.parse(xml);

  const rootElement = Object.keys(parsedData)[0];

  const elements = [];

  inspectObject(parsedData, elements);

  return {
    originalXml: xml,
    data: parsedData,
    metadata: {
      rootElement,
      elements,
    },
  };
}

module.exports = { analyzeXML };
