import "./App.css";
import DocumentCard from "./components/DocumentCard";
import { useEffect, useState } from "react";

function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [documentsError, setDocumentsError] = useState("");
  const [xmlContent, setXmlContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);

  function handleFileChange(event) {
    const file = event.target.files[0];

    if (!file) {
      return;
    }
    if (!file.name.toLowerCase().endsWith(".xml")) {
      setError("Please select and XML file.");
      return;
    }
    setError("");
    setFileName(file.name);
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
      setXmlContent("");
      setFileName("");
      console.log(data);
    } catch (error) {
      console.error("Analysis failed:", error);
      setError(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  }
  async function handleViewDocument(documentId) {
    try {
      const response = await fetch(
        `http://localhost:5000/api/xml/documents/${documentId}`,
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to load document");
      }

      setSelectedDocument(data);
    } catch (error) {
      console.error("Failed to load document:", error);
    }
  }
  useEffect(() => {
    fetch("http://localhost:5000/api/xml/documents")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load documents");
        }
        return response.json();
      })
      .then((data) => {
        console.log(data);
        setDocuments(data);
      })
      .catch((error) => {
        console.error("Failed to load documents", error);
        setDocumentsError("Unable to connect to server.");
      })
      .finally(() => {
        setIsLoadingDocuments(false);
      });
  }, []);

  function handleDeleteDocument(documentId) {
    setDocuments((currentDocuments) =>
      currentDocuments.filter((document) => document._id !== documentId),
    );
  }
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
        {fileName && <p className="selected-file">✓{fileName}</p>}
      </div>
      {xmlContent && <pre className="xml-preview">{xmlContent}</pre>}

      {error && <p className="error-message">{error}</p>}
      <button
        className="analyze-button"
        onClick={handleAnalyze}
        disabled={isAnalyzing || !xmlContent}
      >
        {isAnalyzing ? "Analyzing..." : "Analyze XML"}
      </button>
      <h1 className="xml-title">XML Documents</h1>

      {isLoadingDocuments && (
        <p className="documents-status">Loading Documents..</p>
      )}
      {documentsError && <p className="documents-error">{documentsError}</p>}
      {!isLoadingDocuments && !documentsError && documents.length === 0 && (
        <p className="documents-status">No documents yet</p>
      )}
      <div className="documents-container">
        {documents.map((doc) => (
          <DocumentCard
            key={doc._id}
            doc={doc}
            onDelete={handleDeleteDocument}
            onView={handleViewDocument}
          />
        ))}
      </div>
    </main>
  );
}
export default App;
