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
