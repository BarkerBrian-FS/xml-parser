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

function searchElements(data, elementName, searchTerm) {
  const elements = findElements(data, elementName);

  const lowerSearchTerm = searchTerm.toLowerCase();

  return elements.filter((element) =>
    JSON.stringify(element).toLowerCase().includes(lowerSearchTerm),
  );
}
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
  3. "general" for anything else.
  
  Return only valid JSON in this format:
  {
    "intent": "count" | "search" | "general",
    "elementName": "",
    "searchTerm": ""
  }
  
  Use the available XML elements to identify the correct element name.

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

  const intent = JSON.parse(intentResponse.text);

  if (intent.intent === "count") {
    const elementName = intent.elementName.toLowerCase();

    const count = getElementCount(metadata, elementName);

    if (count === null) {
      return `The document does not contain any "${elementName}" elements.`;
    }

    return `There are ${count} ${elementName} elements in the document.`;
  }
  console.log("AI Intent:", intent);

  const countMatch = question.match(/how many\s+(\w+)(?:\s+elements?)?/i);

  if (countMatch) {
    const elementName = countMatch[1].toLowerCase();

    const singularName = elementName.endsWith("s")
      ? elementName.slice(0, -1)
      : elementName;

    const count = getElementCount(metadata, singularName);

    if (count === null) {
      return `The document does not contain any "${singularName}" elements.`;
    }

    return `There are ${count} ${singularName} elements in the document.`;
  }

  const findMatch = question.match(
    /(?:show|find|get|list)\s+(?:all\s+)?(\w+)/i,
  );

  if (findMatch) {
    const elementName = findMatch[1].toLowerCase();

    const singularName = elementName.endsWith("s")
      ? elementName.slice(0, -1)
      : elementName;

    const results = findElements(data, singularName);

    if (results.length === 0) {
      return `The document does not contain any "${singularName}" elements.`;
    }
    const prompt = `Answer the user's question using the retrieved document records below.
    Present the results in a clean, readable way for the user. 
    Do not invent or modify any information.
    Only use the provided records.
    
    User question: ${question}
    Retrieved records: ${JSON.stringify(results, null, 2)}`;

    const MODEL = "gemini-3.5-flash-lite";

    const response = await generateWithRetry({
      model: MODEL,
      contents: prompt,
    });
    return response.text;
  }

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
