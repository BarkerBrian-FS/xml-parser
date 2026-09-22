const { XMLParser } = require("fast-xml-parser");

const parser = new XMLParser();

function inspectObject(obj, elements, elementCounts) {
  console.log("inspectObject received:", obj);

  if (obj === null || typeof obj !== "object") {
    return;
  }

  const keys = Object.keys(obj);

  for (let i = 0; i < keys.length; i++) {
    const value = obj[keys[i]];

    console.log("KEY:", keys[i], "VALUE:", value);

    elements.push(keys[i]);

    if (Array.isArray(value)) {
      elementCounts.set(keys[i], value.length);

      for (let i = 0; i < value.length; i++) {
        if (value[i] !== null && typeof value[i] === "object") {
          inspectObject(value[i], elements, elementCounts);
        }
      }
    } else {
      elementCounts.set(keys[i], (elementCounts.get(keys[i]) || 0) + 1);

      if (value !== null && typeof value === "object") {
        inspectObject(value, elements, elementCounts);
      }
    }
  }

  return elements;
}

function analyzeXML(xml) {
  const parsedData = parser.parse(xml);

  const rootElement = Object.keys(parsedData)[0];

  const elements = [];
  const elementCounts = new Map();

  inspectObject(parsedData, elements, elementCounts);
  const elementCountObject = Object.fromEntries(elementCounts);

  return {
    originalXml: xml,
    data: parsedData,
    metadata: {
      rootElement,
      elements,
      elementCounts: elementCountObject,
    },
  };
}

module.exports = { analyzeXML };
