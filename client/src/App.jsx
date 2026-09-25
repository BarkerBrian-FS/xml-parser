import "./App.css";
import { useEffect, useState } from "react";

function App() {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/xml/documents")
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setDocuments(data);
      });
  }, []);

  return (
    <>
      <h1>XML Documents</h1>

      {documents.map((doc) => (
        <div className="document-card" key={doc._id}>
          <h2>{doc.metadata.rootElement}</h2>

          <pre>{doc.originalXml}</pre>
          <div className="ai-analysis">
            <h3>AI Analysis</h3>

            <div className="overview-grid">
              <div className="overview-card">
                <h4>Summary</h4>
                <p>{doc.aiAnalysis?.summary || "No summary provided."}</p>
              </div>
              <div className="overview-card">
                <h4>Document Type</h4>
                <p>
                  {doc.aiAnalysis?.documentType || "No document type provided"}
                </p>
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

                {doc.aiAnalysis?.insights?.map((insight, index) => (
                  <p key={index}>{insight}</p>
                ))}
              </>
            )}

            {doc.aiAnalysis?.warnings?.length > 0 && (
              <>
                <h4>Warnings</h4>

                {doc.aiAnalysis?.warnings?.map((warning, index) => (
                  <p key={index}>{warning}</p>
                ))}
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
            {doc.aiAnalysis?.suggestedQuestions?.length > 0 && (
              <>
                <h4>Suggested Questions</h4>

                {doc.aiAnalysis?.suggestedQuestions?.map((question, index) => (
                  <p key={index}>{question}</p>
                ))}
              </>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
export default App;
