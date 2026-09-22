import "./App.css";
import { useEffect, useState } from "react";

function App() {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/xml/documents")
      .then((response) => response.json())
      .then((data) => {
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
        </div>
      ))}
    </>
  );
}

export default App;
