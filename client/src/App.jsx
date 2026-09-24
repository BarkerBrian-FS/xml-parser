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
        <div key={doc._id}>
          <h2>{doc.metadata.rootElement}</h2>

          <pre>{doc.originalXml}</pre>

          <h3>AI Analysis</h3>

          <h4>Summary</h4>
          <p>{doc.aiAnalysis?.summary}</p>

          <h4>Document Type</h4>
          <p>{doc.aiAnalysis?.documentType}</p>

          <h4>Entities</h4>

          {doc.aiAnalysis?.entities?.map((entity) => (
            <div key={entity.name}>
              <strong>{entity.name}</strong>
              <p>{entity.type}</p>
              <p>{entity.description}</p>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
export default App;
