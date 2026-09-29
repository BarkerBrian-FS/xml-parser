import "./App.css";
import DocumentCard from "./components/DocumentCard";
import { useEffect, useState } from "react";

function App() {
  const [documents, setDocuments] = useState([]);
  const [xmlContent, setXmlContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
  function handleDragOver(event) {
    event.preventDefault();
    setIsDragging(false);
  }
  function handleDragLeave(event) {
    event.preventDefault();
    setIsDragging(false);
  }
  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];

    if (!file) {
      return;
    }

    handleFileChange({
      target: {
        files: [file],
      },
    });
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

      <div
        className={`xml-upload ${isDragging ? "dragging" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <h2>Upload Your XML Document</h2>
        <p className="upload-instructions">Drag and Drop your XML file here</p>
        <p className="upload-or">or</p>
        <label className="browse-button">
          Browse Files
          <input type="file" accept=".xml" onChange={handleFileChange} />
        </label>
        {xmlContent && <pre className="xml-preview">{xmlContent}</pre>}

        {error && <p className="error-message">{error}</p>}

        <button onClick={handleAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? "Analyzing..." : "Analyze XML"}
        </button>
      </div>
      <h1>XML Documents</h1>

      <div className="documents-container">
        {documents.map((doc) => (
          <DocumentCard key={doc._id} doc={doc} />
        ))}
      </div>
    </main>
  );
}
export default App;
