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

                {doc.aiAnalysis?.entities?.map((entity) => (
                  <div key={entity.name}>
                    <strong>{entity.name}</strong>
                    <p>{entity.type}</p>
                    <p>{entity.description}</p>
                  </div>
                ))}
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

                {doc.aiAnalysis?.statistics?.map((statistic, index) => (
                  <div key={index}>
                    <h4>{statistic.name}</h4>
                    <p>{statistic.value}</p>
                    <p>{statistic.description}</p>
                  </div>
                ))}
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
