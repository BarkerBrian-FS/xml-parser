import { useState } from "react";

const DocumentCard = ({ doc, onDelete, token }) => {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [isAsking, setIsAsking] = useState(false);
  const [askError, setAskError] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(doc.title || "");

  async function handleAsk(documentId, questionText = question) {
    setIsAsking(true);
    setAskError("");
    setMessages((previousMessages) => [
      ...previousMessages,
      {
        role: "user",
        content: questionText,
      },
      setQuestion(""),
    ]);

    try {
      const response = await fetch("http://localhost:5000/api/xml/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          documentId: documentId,
          question: questionText,
          messages,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to get an answer.");
      }

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          role: "assistant",
          content: data.answer,
        },
      ]);
    } catch (error) {
      console.error(error);

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          role: "assistant",
          content: "Sorry, I couldn't process that question. Please try again.",
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  }

  async function handleDelete(documentId) {
    try {
      const response = await fetch(
        `http://localhost:5000/api/xml/documents/${documentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete the document");
      }
      console.log("Deleting document from UI:", documentId);
      onDelete(documentId);
      console.log(data.message);
    } catch (error) {
      console.error("Delete failed", error);
    }
  }

  async function handleUpdateTitle() {
    try {
      const response = await fetch(
        `http://localhost:5000/api/xml/documents/${doc._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: title,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update title.");
      }
      setTitle(data.title);
      setIsEditingTitle(false);
    } catch (error) {
      console.error("Title update failed:", error);
    }
  }

  function formatStatName(name) {
    return name
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (letter) => letter.toUpperCase());
  }

  return (
    <div>
      <div className="document-card">
        <div>
          <div>
            {isEditingTitle ? (
              <input
                className="title-input"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              ></input>
            ) : (
              <h2>{title || doc.metadata?.rootElement || "Unknown"}</h2>
            )}
          </div>
          <div className="document-buttons">
            {isEditingTitle ? (
              <>
                <button className="edit-button" onClick={handleUpdateTitle}>
                  Save
                </button>
                <button
                  className="delete-button"
                  onClick={() => {
                    setTitle(doc.title || "");
                    setIsEditingTitle(false);
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  className="edit-button"
                  onClick={() => setIsEditingTitle(true)}
                >
                  Edit
                </button>
                <button
                  className="delete-button"
                  onClick={() => handleDelete(doc._id)}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
        <pre className="xml-viewer">{doc.originalXml}</pre>
        <div className="document-actions">
          <button
            onClick={() =>
              window.open(
                `http://localhost:5000/api/xml/documents/${doc._id}/pdf`,
                "_blank",
              )
            }
          >
            Export PDF
          </button>
          <button
            onClick={() =>
              window.open(
                `http://localhost:5000/api/xml/documents/${doc._id}/json`,
                "_blank",
              )
            }
          >
            Export JSON
          </button>
          <button
            onClick={() =>
              window.open(
                `http://localhost:5000/api/xml/documents/${doc._id}/xml`,
                "_blank",
              )
            }
          >
            Export XML
          </button>
        </div>
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
                    <h5 className="stat-name">
                      {formatStatName(statistic.name)}
                    </h5>
                    <div className="stat-value">
                      {statistic.value}
                      {statistic.unit && <span>{statistic.unit}</span>}
                    </div>
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
            <div className="chat-header">
              <h3>Ask About This Data</h3>
              {messages.length > 0 && (
                <button onClick={() => setMessages([])}>Clear Chat</button>
              )}
            </div>
            <div className="ask-controls">
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
            </div>
            <div className="chat-messages">
              {messages
                .filter((message) => message)
                .map((message, index) => (
                  <div key={index} className={`chat-message ${message.role}`}>
                    <strong>{message.role === "user" ? "You" : "AI"}</strong>

                    <p style={{ whiteSpace: "pre-line" }}>{message.content}</p>
                  </div>
                ))}
              {isAsking && (
                <div className="chat-message assistant">
                  <strong>AI</strong>
                  <p className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </p>
                </div>
              )}
            </div>
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
