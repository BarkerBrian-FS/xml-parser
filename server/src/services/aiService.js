const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

function getElementCount(metadata, elementName) {
  const counts = metadata?.elementCounts || {};

  if (!(elementName in counts)) {
    return null;
  }
  return counts[elementName];
}

function findElements(data, elementName) {
  if (!data || typeof data !== "object") {
    return [];
  }

  const results = [];

  function searchObject(obj) {
    if (!obj || typeof obj !== "object") {
      return;
    }

    for (const key of Object.keys(obj)) {
      const value = obj[key];

      if (key === elementName) {
        if (Array.isArray(value)) {
          results.push(...value);
        } else {
          results.push(value);
        }
      }

      if (value && typeof value === "object") {
        searchObject(value);
      }
    }
  }

  searchObject(data);

  return results;
}

function searchElements(data, elementName, fieldName, searchTerm) {
  const elements = findElements(data, elementName);

  const lowerSearchTerm = searchTerm.toLowerCase();

  return elements.filter((element) => {
    if (fieldName) {
      const value = element[fieldName];

      return (
        value !== undefined &&
        String(value).toLocaleLowerCase().includes(lowerSearchTerm)
      );
    }
    return JSON.stringify(element).toLowerCase().includes(lowerSearchTerm);
  });
}
function sumElementValues(data, elementName, fieldName) {
  const elements = findElements(data, elementName);

  let total = 0;

  for (const element of elements) {
    const value = Number(element[fieldName]);

    if (!Number.isNaN(value)) {
      total += value;
    }
  }
  return total;
}
function sumProductValues(data, elementName, fieldA, fieldB) {
  const elements = findElements(data, elementName);

  let total = 0;

  for (const element of elements) {
    const valueA = Number(element[fieldA]);
    const valueB = Number(element[fieldB]);

    if (!Number.isNaN(valueA) && !Number.isNaN(valueB)) {
      total += valueA * valueB;
    }
  }
  return total;
}
function averageElementValue(data, elementName, fieldName) {
  const elements = findElements(data, elementName);

  let total = 0;
  let count = 0;

  for (const element of elements) {
    const value = Number(element[fieldName]);

    if (!Number.isNaN(value)) {
      total += value;
      count++;
    }
  }
  if (count === 0) {
    return null;
  }
  return total / count;
}
function findMaxElement(data, elementName, fieldName) {
  const elements = findElements(data, elementName);

  let maxElement = null;
  let maxValue = -Infinity;

  for (const element of elements) {
    const value = Number(element[fieldName]);

    if (!Number.isNaN(value) && value > maxValue) {
      maxValue = value;
      maxElement = element;
    }
  }
  return maxElement;
}
function findMinElement(data, elementName, fieldName) {
  const elements = findElements(data, elementName);

  let minElement = null;
  let minValue = Infinity;

  for (const element of elements) {
    const value = Number(element[fieldName]);

    if (!Number.isNaN(value) && value < minValue) {
      minValue = value;
      minElement = element;
    }
  }
  return minElement;
}
function filterElement() {}
async function askAboutDocument(
  data,
  metadata,
  aiAnalysis,
  question,
  messages,
) {
  const MODEL = "gemini-3.5-flash-lite";

  const intentPrompt = `
  Determing whether the user's question is asking to
  
  Possible intents:

  1. "count" if the user wants to know how many elements or records exist.

  2. "search" if the user wants to find specific records.

  For "search":
- elementName should contain the type of record being searched.
- searchTerm should contain the value the user wants to find.
- fieldName should contain the specific field being searched when the user identifies one.
- If the user is searching across the entire record without specifying a field, fieldName should be empty.

Example:
Question: "Find products in the Electronics category."
Return:
{
    "intent": "search",
    "operation": "",
    "elementName": "product",
    "fieldName": "category",
    "secondaryFieldName": "",
    "searchTerm": "Electronics"
}

Example:
Question: "Find products containing the word laptop."
Return:
{
    "intent": "search",
    "operation": "",
    "elementName": "product",
    "fieldName": "",
    "secondaryFieldName": "",
    "searchTerm": "laptop"
}
  3. "calculate" for calculations using document data.

For calculations, determine the operation:
- "sum" when adding values from a single field.
- "average" when calculating the average value of a numeric field across records.
- "max" when finding the record with the highest numeric value in a field.
- "min" when finding the record with the lowest numeric value in a field.
- "sum_product" when calculating the total value by multiplying two fields for each record and then adding those results together.

For "sum":
- fieldName should contain the field being summed.
- secondaryFieldName should be empty.

Question: "What is the mileage across all vehicles?"
Return:
{
    "intent": "calculate",
    "operation": "sum",
    "elementName": "vehicle",
    "fieldName": "mileage",
    "secondaryFieldName": "",
    "searchTerm": ""
}

For "sum_product":
- fieldName should contain the first field.
- secondaryFieldName should contain the second field.

Question: "What is the total value of stock across the entire catalog?"
Return:
{
    "intent": "calculate",
    "operation": "sum_product",
    "elementName": "product",
    "fieldName": "price",
    "secondaryFieldName": "stock",
    "searchTerm": ""
}

For "average"
- fieldName should contain a numeric field being averaged.
- secondaryFieldName should be empty.
- elementName should be the record or element that contains the field being averaged.
- Do not use the document root element unless the field is directly contained within it.

Question: "what is the avarge mileage of all the vehicles?"
Return: 
{
  "intent": "calculate",
  "operation": "average",
  "elementName": "vehicle",
  "fieldName": "mileage",
  "secondaryFieldName": "",
  "searchTerm": ""
}

For "max":
- fieldName should contain the numeric field being compared.
- elementName should be the record or element that contains the field.
- Do not use the document root element unless the field is directly contained within it.

Example:
Question: "Which vehicle has the highest mileage?"
Return:
{
    "intent": "calculate",
    "operation": "max",
    "elementName": "vehicle",
    "fieldName": "mileage",
    "secondaryFieldName": "",
    "searchTerm": ""
}

For "min"
- fieldName should contain the numeric field being compared.
- elementName should be the record or element that contains the field.
- Do not use the document root element unless the field is directly contained within it.

Example:
Question: "Which vehicle has the lowest mileage?"
Return:
{
    "intent": "calculate",
    "operation": "min",
    "elementName": "vehicle",
    "fieldName": "mileage",
    "secondaryFieldName": "",
    "searchTerm": ""
}
  4. "filter" if the user wants to find records that match one or more conditions.

  For "filter":
- elementName should contain the type of record being filtered.
- conditions should contain one or more conditions.
- Each condition must contain:
  - fieldName: the field being evaluated.
  - operator: the comparison being requested.
  - value: the value being compared against.

  Supported operators:
- "equals"
- "notEquals"
- "greaterThan"
- "lessThan"
- "greaterThanOrEqual"
- "lessThanOrEqual"

Example:
Question: "Find products in Electronics that cost more than $500."

Return:
{
  "intent": "filter",
  "operation": "",
  "elementName": "product",
  "conditions": [
    {
      "fieldName": "category",
      "operator": "equals",
      "value": "Electronics"
    },
    {
      "fieldName": "price",
      "operator": "greaterThan",
      "value": 500
    }
  ]
}

Example:
Question: "Find vehicles with mileage greater than 20000."

Return:
{
  "intent": "filter",
  "operation": "",
  "elementName": "vehicle",
  "conditions": [
    {
      "fieldName": "mileage",
      "operator": "greaterThan",
      "value": 20000
    }
  ]
}

  5. "general" for anything else.
  
  Return only valid JSON in this format:
  {
    "intent": "count" | "search" | "calculate" | "general" | "filter",
    "operation": "",
    "elementName": "",
    "fieldName": "",
    "secondaryFieldName": "",
    "searchTerm": ""
  }
  
  Use the available XML elements to identify the correct element name. For calculations, choose the element that contains the requested field, especially when the document root contains repeated child records.

  Available XML elements: ${JSON.stringify(metadata?.elements || [])}

  User question : ${question}
  `;

  const intentResponse = await generateWithRetry({
    model: MODEL,
    contents: intentPrompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  console.log("Intent response:", intentResponse.text);

  const intent = JSON.parse(intentResponse.text);

  if (intent.intent === "count") {
    const elementName = intent.elementName.toLowerCase();

    const count = getElementCount(metadata, elementName);

    if (count === null) {
      return `The document does not contain any "${elementName}" elements.`;
    }

    return `There are ${count} ${elementName} elements in the document.`;
  }

  if (intent.intent === "search") {
    const elementName = intent.elementName.toLowerCase();
    const searchTerm = intent.searchTerm.trim();
    const fieldName = intent.fieldName.toLowerCase();

    const results = searchElements(data, elementName, fieldName, searchTerm);

    console.log("Search results:", results);

    if (results.length === 0) {
      return `I couldn't find any ${elementName} elements matching ${searchTerm}.`;
    }

    return `I found ${results.length} matching ${elementName} records:\n\n${results
      .map((result, index) => {
        const fields = Object.entries(result)
          .map(([key, value]) => `   ${key}: ${value}`)
          .join("\n");

        return `${index + 1}. ${fields}`;
      })
      .join("\n\n----------------\n\n")}`;
  }

  if (intent.intent === "calculate") {
    const elementName = intent.elementName.toLowerCase();
    const fieldName = intent.fieldName.toLowerCase();

    let total;

    if (intent.operation === "sum_product") {
      const secondaryFieldName = intent.secondaryFieldName.toLowerCase();

      total = sumProductValues(
        data,
        elementName,
        fieldName,
        secondaryFieldName,
      );
    } else if (intent.operation === "average") {
      total = averageElementValue(data, elementName, fieldName);
    } else if (intent.operation === "max") {
      total = findMaxElement(data, elementName, fieldName);
    } else if (intent.operation === "min") {
      total = findMinElement(data, elementName, fieldName);
    } else {
      total = sumElementValues(data, elementName, fieldName);
    }

    console.log("Calculation intent:", intent);
    console.log("Calculated total:", total);

    if (intent.operation === "sum_product") {
      return `The total inventory value across all ${elementName}s is $${total.toLocaleString(
        undefined,
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        },
      )}`;
    }
    if (intent.operation === "average") {
      return `The average ${fieldName} across all ${elementName}s is ${total.toLocaleString()}.`;
    }
    if (intent.operation === "max") {
      return `The ${elementName} with the highest ${fieldName} has a value of ${Number(
        total[fieldName],
      ).toLocaleString()}.`;
    }
    if (intent.operation === "min") {
      return `The ${elementName} with the lowest ${fieldName} has a value of ${Number(
        total[fieldName],
      ).toLocaleString()}.`;
    }

    return `The total ${fieldName} across all ${elementName}s is ${total.toLocaleString()}.`;
  }

  console.log("AI Intent:", intent);

  const searchMatch = question.match(
    /(?:find|search)\s+(?:all\s+)?(\w+)\s+(?:in|with|containing)\s+(.+)/i,
  );

  if (searchMatch) {
    const elementName = searchMatch[1].toLowerCase();
    const searchTerm = searchMatch[2].trim();

    const singularName = elementName.endsWith("s")
      ? elementName.slice(0, -1)
      : elementName;

    const results = searchElements(data, singularName, searchTerm);
    if (results.length === 0) {
      return `I couldn't find any "${singularName}" elements matching "${searchTerm}"`;
    }

    const prompt = ` Answer the user's question using the retrieved document records below.

  Present the results in a clean readable way. 
  Do not invent or modify the information.
  Only use the provided records.
  
  User question : ${question}
  
  Search term: ${searchTerm}
  
  Retrieved records: ${JSON.stringify(results, null, 2)}`;

    const MODEL = "gemini-3.5-flash-lite";

    const response = geneerateWithRetry({
      model: MODEL,
      contents: prompt,
    });

    return response.text;
  }
  const prompt = `
Answer the user's question using only the provided document data and analysis.

Do not invent information or make assumptions.
If the answer cannot be determined from the provided information, clearly say so.

Conversation history: ${JSON.stringify(messages || [], null, 2)}

User question:
${question}

Document data:
${JSON.stringify(data, null, 2)}

Metadata:
${JSON.stringify(metadata, null, 2)}

Existing AI analysis:
${JSON.stringify(aiAnalysis, null, 2)}
`;

  const response = await generateWithRetry({
    model: MODEL,
    contents: prompt,
  });

  return response.text;
}

async function generateWithRetry(request, attempts = 3) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await ai.models.generateContent(request);
    } catch (error) {
      if (error.status !== 503 || attempt === attempts) {
        throw error;
      }
      const delay = attempt * 2000;

      console.log(`Gemini unavailable. Retrying in ${delay / 1000} seconds...`);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function analyzeDocument(data, metadata) {
  const MODEL = "gemini-3.5-flash-lite";

  console.log("Using Gemini model:", MODEL);

  const prompt = `
Analyze the provided XML data and its associated metadata.

Use only the information contained in the provided data and metadata. Do not invent, assume, modify, rewrite, or omit information. If information is missing or uncertain, indicate that clearly.
Never invent units or values. Only include a unit when it exists explicitly in the provided XML data or metadata. If no unit is provided, return only the original value.
For statistics, always return the value as a string. Preserve the original numeric value exactly as provided in the data. Do not add units unless the unit is explicitly present in the data.

Provide:
1. A concise 2-3 sentence summary of the document and its main contents.
2. The most likely document type.
3. Relevant entities found in the data, including people, organizations, locations, dates, identifiers, products, and other important concepts.
4. Meaningful patterns, relationships, trends, or notable findings.
5. Data quality issues, inconsistencies, missing values, unusual content, or other items that may require review. If none are found, return an empty warnings array.
6. Useful statistics that can be directly calculated from the provided data. Preserve any units associated with numeric values. If the XML provides a unit through an attribute or related field, include that unit in the statistic. Do not calculate statistics when the required information is unavailable.
7. Useful follow-up questions a user could ask about the data.

Preserve original values, field names, identifiers, dates, numbers, and entity names. Clearly distinguish facts found in the data from analytical observations.

For every statistic, the "value" must contain ONLY the original value from the XML element.
Do not append, prepend, convert, reinterpret, or invent units.
For example, if the XML contains <fuelLevel unit="percent">73</fuelLevel>, return "73", not "73 percent", "73%", "73C", or any other variation.
If a unit attribute exists, it may be mentioned in the description, but never modify the value itself.

For entities, keep the "type" field concise and categorical, such as "Mission", "Person", "Location", "Spacecraft", or "Observation".
Put additional details such as roles, identifiers, specialties, or descriptions in the "description" field.

For entities, keep the "type" field short and categorical.
Use values such as "Person", "Mission", "Location", "Spacecraft", "Observation", "Organization", or "Product".
Put roles, identifiers, specialties, statuses, timestamps, and other additional information in the "description" field.
Do not combine the entity type with its details.

Do not infer causal relationships, correlations, or explanations unless they are explicitly supported by the provided data.
If you identify a possible pattern, describe it as a possible pattern and do not state that one factor causes another.

XML Data:
${JSON.stringify(data, null, 2)}

Metadata:
${JSON.stringify(metadata, null, 2)}
`;

  const response = await generateWithRetry({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  });

  console.log("Gemini raw response:");
  console.log(response.text);

  const result = JSON.parse(response.text);

  return result;
}

const responseSchema = {
  type: "object",
  properties: {
    summary: {
      type: "string",
    },

    documentType: {
      type: "string",
    },
    entities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
          type: {
            type: "string",
          },
          description: {
            type: "string",
          },
        },
      },
    },
    insights: {
      type: "array",
      items: {
        type: "string",
      },
    },

    warnings: {
      type: "array",
      items: {
        type: "string",
      },
    },
    statistics: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
          value: {
            type: "string",
          },
          unit: { type: "string" },
          description: {
            type: "string",
          },
        },
      },
    },
    suggestedQuestions: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },
  required: [
    "summary",
    "documentType",
    "entities",
    "insights",
    "warnings",
    "statistics",
    "suggestedQuestions",
  ],
};

module.exports = { ai, responseSchema, analyzeDocument, askAboutDocument };
