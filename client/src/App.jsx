import "./App.css";
import { useEffect, useState } from "react";

function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [xmlContent, setXmlContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  function handleFileChange(event) {
    const file = event.target.files[0];

    if (!file) {
      return;
    }
    const reader = new FileReader();

    reader.onload = () => {
      setXmlContent(reader.result);
    };
    reader.readAsText(file);
  }

  async function handleAnalyze() {
    setIsAnalyzing(true);
    setError("");

    try {
      console.log("XML being sent:");
      console.log(xmlContent);
      const response = await fetch("http://localhost:5000/api/xml/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/xml",
        },
        body: xmlContent,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Analysis Failed");
      }

      setDocuments((currentDocuments) => [data, ...currentDocuments]);

      console.log(data);
    } catch (error) {
      console.error("Analysis failed:", error);
      setError(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  useEffect(() => {
    fetch("http://localhost:5000/api/xml/documents")
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setDocuments(data);
      });
  }, []);

  return (
    <main className={`app ${darkMode ? "dark" : ""}`}>
      <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? "Light Mode" : "Dark Mode"}
      </button>

      <div className="xml-upload">
        <h2>Upload XML Document</h2>
        <input type="file" accept=".xml" onChange={handleFileChange}></input>
        {xmlContent && <pre className="xml-preview">{xmlContent}</pre>}

        {error && <p className="error-message">{error}</p>}

        <button onClick={handleAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? "Analyzing..." : "Analyze XML"}
        </button>
      </div>
      <h1>XML Documents</h1>

      <div className="documents-container">
        {documents.map((doc) => (
          <div className="document-card" key={doc._id}>
            <h2>Document: {doc.metadata?.rootElement || "Unknown"}</h2>
            <pre className="xml-viewer">{doc.originalXml}</pre>
            <h3>Parsed Data</h3>
            <pre className="parsed-data-viewer">
              {JSON.stringify(doc.data, null, 2)}
            </pre>
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
                    {doc.aiAnalysis?.documentType ||
                      "No document type provided"}
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
              {doc.aiAnalysis?.suggestedQuestions?.length > 0 && (
                <>
                  <h4>Suggested Questions</h4>
                  <div className="questions-list">
                    {doc.aiAnalysis?.suggestedQuestions?.map(
                      (question, index) => (
                        <button className="question-button" key={index}>
                          {question}
                        </button>
                      ),
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
export default App;
