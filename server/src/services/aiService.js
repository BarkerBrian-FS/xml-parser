const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

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

Provide:
1. A concise 2-3 sentence summary of the document and its main contents.
2. The most likely document type.
3. Relevant entities found in the data, including people, organizations, locations, dates, identifiers, products, and other important concepts.
4. Meaningful patterns, relationships, trends, or notable findings.
5. Data quality issues, inconsistencies, missing values, unusual content, or other items that may require review. If none are found, return an empty warnings array.
6. Useful statistics that can be directly calculated from the provided data. Preserve any units associated with numeric values. If the XML provides a unit through an attribute or related field, include that unit in the statistic. Do not calculate statistics when the required information is unavailable.
7. Useful follow-up questions a user could ask about the data.

Preserve original values, field names, identifiers, dates, numbers, and entity names. Clearly distinguish facts found in the data from analytical observations.

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
            anyOf: [
              {
                type: "string",
              },
              {
                type: "number",
              },
            ],
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

module.exports = { ai, responseSchema, analyzeDocument };
