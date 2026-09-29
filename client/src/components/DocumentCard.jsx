import { useState } from "react";

const DocumentCard = ({ doc }) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [askError, setAskError] = useState("");

  async function handleAsk(documentId, questionText = question) {
    setIsAsking(true);
    setAskError("");

    try {
      const response = await fetch("http://localhost:5000/api/xml/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: documentId,
          question: questionText,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to get an answer.");
      }

      setAnswer(data.answer);
    } catch (error) {
      setAskError(error.message);
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <div>
      <div className="document-card">
        <h2>Document: {doc.metadata?.rootElement || "Unknown"}</h2>
        <pre className="xml-viewer">{doc.originalXml}</pre>
        <div className="ai-analysis">
          <h3>AI Analysis</h3>
          <div className="overview-grid">
            <div className="overview-card">
              <h4>Summary</h4>
              <p>{doc.aiAnalysis?.summary || "No summary provided."}</p>
            </div>
            <div className="overview-card">
              <h4>Document Type</h4>
              <span className="document-type-badge">
                {doc.aiAnalysis?.documentType || "No document type provided"}
              </span>
            </div>
          </div>
          {doc.aiAnalysis?.entities?.length > 0 && (
            <>
              <h4>Entities</h4>
              <div className="entities-grid">
                {doc.aiAnalysis?.entities?.map((entity) => (
                  <div className="entity-card" key={entity.name}>
                    <strong>{entity.name}</strong>
                    <span>{entity.type}</span>
                    {entity.description && <p>{entity.description}</p>}
                  </div>
                ))}
              </div>
            </>
          )}
          {doc.aiAnalysis?.insights?.length > 0 && (
            <>
              <h4>Insights</h4>
              <div className="insight-list">
                {doc.aiAnalysis?.insights?.map((insight, index) => (
                  <div className="insight-item" key={index}>
                    <p>{insight}</p>
                  </div>
                ))}
              </div>
            </>
          )}
          {doc.aiAnalysis?.warnings?.length > 0 && (
            <>
              <h4>Warnings</h4>
              <div className="warning-list">
                {doc.aiAnalysis?.warnings?.map((warning, index) => (
                  <div className="warnings-item" key={index}>
                    <p> {warning}</p>
                  </div>
                ))}
              </div>
            </>
          )}
          {doc.aiAnalysis?.statistics?.length > 0 && (
            <>
              <h4>Statistics</h4>
              <div className="statistics-grid">
                {doc.aiAnalysis?.statistics?.map((statistic, index) => (
                  <div className="stat-card" key={index}>
                    <h4 className="stat-name">{statistic.name}</h4>
                    <p className="stat-value">{statistic.value}</p>
                    {statistic.description && (
                      <p className="stat-description">
                        {statistic.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="ask-section">
            <h3>Ask About This Data</h3>
            <input
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask a question about the document"
            ></input>
            <button
              className="ask-button"
              onClick={() => handleAsk(doc._id)}
              disabled={isAsking}
            >
              {isAsking ? "Asking..." : "Ask"}
            </button>
            {askError && <p className="error-message">{askError}</p>}
            {answer && (
              <div className="ai-answer">
                <h4>AI Answer</h4>
                <p>{answer}</p>
              </div>
            )}
          </div>
          {doc.aiAnalysis?.suggestedQuestions?.length > 0 && (
            <>
              <h4>Suggested Questions</h4>
              <div className="questions-list">
                {doc.aiAnalysis?.suggestedQuestions?.map((question, index) => (
                  <button
                    className="question-button"
                    key={index}
                    onClick={() => handleAsk(doc._id, question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;
