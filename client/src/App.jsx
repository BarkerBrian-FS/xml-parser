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
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [filter, setFilter] = useState("all");

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
  function handleDeleteDocument(documentId) {
    setDocuments((currentDocuments) =>
      currentDocuments.filter((document) => document._id !== documentId),
    );
  }

  useEffect(() => {
    fetch(
      `http://localhost:5000/api/xml/documents?search=${encodeURIComponent(search)}`,
    )
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
  }, [search]);
  const filteredDocuments = documents.filter((doc) => {
    if (filter === "warnings") {
      return doc.aiAnalysis?.warnings?.length > 0;
    }
    return true;
  });
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    const titleA = a.title || a.metadata?.rootElement || "";
    const titleB = b.title || b.metadata?.rootElement || "";

    if (sort === "title-asc") {
      return titleA.localeCompare(titleB);
    }

    if (sort === "title-desc") {
      return titleB.localeCompare(titleA);
    }

    if (sort === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }

    if (sort === "oldest") {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }

    return 0;
  });

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

      <div className="search-container">
        <input
          type="text"
          placeholder="Search documents..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="title-asc">Title A-Z</option>
          <option value="title-desc">Title Z-A</option>
        </select>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="all">All Documents</option>
          <option value="warnings">Has Warnings</option>
        </select>
      </div>

      <div className="documents-container">
        {filteredDocuments.length === 0 && (search || filter === "warnings") ? (
          <p>No documents found for "{search}"</p>
        ) : (
          sortedDocuments.map((doc) => (
            <DocumentCard
              key={doc._id}
              doc={doc}
              onDelete={handleDeleteDocument}
            />
          ))
        )}
      </div>
    </main>
  );
}
export default App;
