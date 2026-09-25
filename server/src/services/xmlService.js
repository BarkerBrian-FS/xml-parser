const { XMLParser, XMLValidator } = require("fast-xml-parser");

const parser = new XMLParser({
  ignoreAttributes: false,
  ignoreDeclaration: true,
});

function inspectObject(obj, elements, elementCounts, attributeCounts) {
  console.log("inspectObject received:", obj);

  if (obj === null || typeof obj !== "object") {
    return;
  }

  const keys = Object.keys(obj);

  for (let i = 0; i < keys.length; i++) {
    const value = obj[keys[i]];

    console.log("KEY:", keys[i], "VALUE:", value);

    if (keys[i].startsWith("@_")) {
      const attributeName = keys[i].slice(2);

      attributeCounts.set(
        attributeName,
        (attributeCounts.get(attributeName) || 0) + 1,
      );
    } else {
      elements.add(keys[i]);

      if (Array.isArray(value)) {
        elementCounts.set(keys[i], value.length);

        // We'll update this recursive call next
        for (let i = 0; i < value.length; i++) {
          if (value[i] !== null && typeof value[i] === "object") {
            inspectObject(value[i], elements, elementCounts, attributeCounts);
          }
        }
      } else {
        elementCounts.set(keys[i], (elementCounts.get(keys[i]) || 0) + 1);

        // We'll update this recursive call next
        if (value !== null && typeof value === "object") {
          inspectObject(value, elements, elementCounts, attributeCounts);
        }
      }
    }
  }

  return elements;
}

function analyzeXML(xml) {
  const validationResult = XMLValidator.validate(xml);

  console.log(validationResult);
  if (validationResult !== true) {
    return {
      valid: false,
      error: validationResult.err,
    };
  }

  const parsedData = parser.parse(xml);

  console.log("Parsed XML:");
  console.log(parsedData);

  const rootElement = Object.keys(parsedData)[0];

  const elements = new Set();
  const elementCounts = new Map();
  const attributeCounts = new Map();

  inspectObject(parsedData, elements, elementCounts, attributeCounts);
  const elementCountObject = Object.fromEntries(elementCounts);
  const attributeCountObject = Object.fromEntries(attributeCounts);
  return {
    valid: true,
    originalXml: xml,
    data: parsedData,
    metadata: {
      rootElement,
      elements: [...elements],
      elementCounts: elementCountObject,
      attributeCounts: attributeCountObject,
    },
  };
}

module.exports = { analyzeXML };
