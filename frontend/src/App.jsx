
import { useEffect, useState } from "react";
import {
  uploadDocument,
  getDocuments,
  getExtractedText
} from "./services/api";
import "./App.css";

function App() {
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [activePage, setActivePage] = useState("Overview");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [documents, setDocuments] = useState([]);

  // Extraction viewer states
  const [extractedText, setExtractedText] = useState(null);
  const [extractingId, setExtractingId] = useState(null);
  const [extractionError, setExtractionError] = useState("");

  // Check backend connection and retrieve saved documents
  useEffect(() => {
    fetch("http://127.0.0.1:8000/health")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend unavailable");
        }
        return response.json();
      })
      .then(() => setBackendStatus("Connected"))
      .catch(() => setBackendStatus("Disconnected"));

    getDocuments()
      .then((result) => {
        setDocuments(result.documents);
      })
      .catch((error) => {
        console.error("Document loading error:", error);
      });
  }, []);

  // Upload selected document
  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadMessage("Please select a document first.");
      return;
    }

    setUploading(true);
    setUploadMessage("");

    try {
      const result = await uploadDocument(selectedFile);

      setDocuments((previous) => [
        ...previous,
        {
          ...result,
          document_id: result.document_id,
          original_filename: result.original_filename,
        },
      ]);

      setUploadMessage("Document uploaded successfully!");
      setSelectedFile(null);

      const fileInput = document.getElementById("document-input");

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      setUploadMessage(error.message);
    } finally {
      setUploading(false);
    }
  };

  // Retrieve extracted text for a document
  const handleViewExtractedText = async (documentId) => {
    setExtractingId(documentId);
    setExtractedText(null);
    setExtractionError("");

    try {
      const result = await getExtractedText(documentId);
      setExtractedText(result);
    } catch (error) {
      setExtractionError(error.message);
    } finally {
      setExtractingId(null);
    }
  };

  const navigationItems = [
    "Overview",
    "Documents",
    "Findings",
    "Evidence Graph",
    "Reports",
  ];

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="brand">
          <h2>DocuTrace AI</h2>
          <p>Document Intelligence</p>
        </div>

        <nav>
          {navigationItems.map((item) => (
            <button
              key={item}
              className={
                activePage === item ? "nav-item active" : "nav-item"
              }
              onClick={() => setActivePage(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          AI-Powered Document Forensics
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>{activePage}</h1>
            <p>Document Forensics & Contextual Intelligence</p>
          </div>

          <div className="backend-status">
            <span
              className={
                backendStatus === "Connected"
                  ? "status-dot"
                  : "status-dot disconnected"
              }
            ></span>
            Backend: {backendStatus}
          </div>
        </header>

        <section className="stats-grid">
          <div className="stat-card">
            <p>Total Cases</p>
            <h2>0</h2>
          </div>

          <div className="stat-card">
            <p>Documents Uploaded</p>
            <h2>{documents.length}</h2>
          </div>

          <div className="stat-card">
            <p>Findings Detected</p>
            <h2>0</h2>
          </div>

          <div className="stat-card">
            <p>Backend Status</p>
            <h2 className="status-text">{backendStatus}</h2>
          </div>
        </section>

        <section className="upload-section">
          <div className="section-heading">
            <h2>Document Upload</h2>
            <p>Upload documents for forensic analysis</p>
          </div>

          <div className="upload-box">
            <div className="upload-icon">↑</div>

            <h3>Select a document</h3>
            <p>Supported formats: PDF, DOCX, PNG, JPG</p>

            <input
              id="document-input"
              type="file"
              accept=".pdf,.docx,.png,.jpg,.jpeg"
              onChange={(event) => {
                setSelectedFile(event.target.files[0] || null);
                setUploadMessage("");
              }}
            />

            {selectedFile && (
              <p className="selected-file">
                Selected: {selectedFile.name}
              </p>
            )}

            <button
              className="upload-button"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload Document"}
            </button>

            {uploadMessage && (
              <p className="upload-message">{uploadMessage}</p>
            )}
          </div>
        </section>

        <section className="documents-section">
          <div className="section-heading">
            <h2>Uploaded Documents</h2>
            <p>Documents stored in the backend</p>
          </div>

          {documents.length === 0 ? (
            <div className="empty-state">
              No documents uploaded yet.
            </div>
          ) : (
            <div className="document-list">
              {documents.map((document) => (
                <div
                  className="document-item"
                  key={document.document_id}
                >
                  <div>
                    <strong>{document.original_filename}</strong>
                    <p>ID: {document.document_id}</p>
                  </div>

                  <div>
                    <span className="document-status">
                      Uploaded
                    </span>

                    {document.file_extension === ".pdf" && (
                      <button
                        className="upload-button"
                        onClick={() =>
                          handleViewExtractedText(document.document_id)
                        }
                        disabled={extractingId === document.document_id}
                      >
                        {extractingId === document.document_id
                          ? "Loading..."
                          : "View Extracted Text"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {extractionError && (
          <section className="notice-section">
            <strong>Extraction Error</strong>
            <p>{extractionError}</p>
          </section>
        )}

        {extractedText && (
          <section className="documents-section">
            <div className="section-heading">
              <h2>Extracted Document Text</h2>
              <p>
                {extractedText.total_pages} pages extracted
              </p>
            </div>

            <button
              className="upload-button"
              onClick={() => setExtractedText(null)}
            >
              Close Text Viewer
            </button>

            {extractedText.pages.map((page) => (
              <div
                className="document-item"
                key={page.page_number}
                style={{ marginTop: "15px", display: "block" }}
              >
                <strong>Page {page.page_number}</strong>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    marginTop: "12px",
                    fontFamily: "inherit",
                    lineHeight: "1.6",
                  }}
                >
                  {page.text || "No text found on this page."}
                </pre>
              </div>
            ))}
          </section>
        )}

        <section className="notice-section">
          <strong>Evidence-first analysis</strong>
          <p>
            Every finding will be supported by traceable document evidence.
            Automated observations will require human review.
          </p>
        </section>
      </main>
    </div>
  );
}

export default App;
