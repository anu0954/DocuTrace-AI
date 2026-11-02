
import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [currentPage, setCurrentPage] = useState("Overview");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/health")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend request failed");
        }
        return response.json();
      })
      .then((data) => {
        setBackendStatus(data.status === "healthy" ? "Connected" : "Unavailable");
      })
      .catch(() => {
        setBackendStatus("Disconnected");
      });
  }, []);

  const menuItems = [
    { name: "Overview", icon: "▦" },
    { name: "Documents", icon: "▤" },
    { name: "Findings", icon: "⚑" },
    { name: "Evidence Graph", icon: "◇" },
    { name: "Reports", icon: "▧" },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">D</div>
          <div>
            <h2>DocuTrace AI</h2>
            <span>Document Intelligence</span>
          </div>
        </div>

        <p className="nav-heading">WORKSPACE</p>

        <nav>
          {menuItems.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${
                currentPage === item.name ? "active" : ""
              }`}
              onClick={() => setCurrentPage(item.name)}
            >
              <span>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="backend-indicator">
            <span
              className={
                backendStatus === "Connected"
                  ? "status-dot online"
                  : "status-dot offline"
              }
            ></span>
            <div>
              <strong>Backend status</strong>
              <small>{backendStatus}</small>
            </div>
          </div>
          <p>DocuTrace AI v1.0.0</p>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace /</span>
            <strong>{currentPage}</strong>
          </div>
          <div className="user-profile">
            <div className="avatar">DT</div>
            <span>Investigator</span>
          </div>
        </header>

        <section className="page-content">
          <div className="welcome-section">
            <div>
              <p className="eyebrow">DOCUMENT FORENSICS PLATFORM</p>
              <h1>{currentPage}</h1>
              <p className="subtitle">
                Analyze documents, identify inconsistencies and trace
                evidence with explainable intelligence.
              </p>
            </div>
            <div className="case-button">
              <span>✦</span> Investigation Workspace
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Total Cases</span>
              <h2>0</h2>
              <p>No cases created yet</p>
            </div>
            <div className="stat-card">
              <span className="stat-label">Documents Analyzed</span>
              <h2>0</h2>
              <p>Awaiting document uploads</p>
            </div>
            <div className="stat-card">
              <span className="stat-label">Findings Detected</span>
              <h2>0</h2>
              <p>No findings available</p>
            </div>
            <div className="stat-card">
              <span className="stat-label">Backend Connection</span>
              <h2 className="connection-value">{backendStatus}</h2>
              <p>FastAPI service status</p>
            </div>
          </div>

          <div className="workspace-grid">
            <section className="panel upload-panel">
              <div className="panel-heading">
                <div>
                  <h3>Start an investigation</h3>
                  <p>Upload documents to begin forensic analysis.</p>
                </div>
                <span className="panel-icon">↥</span>
              </div>

              <div className="upload-placeholder">
                <div className="upload-icon">↑</div>
                <h3>Document upload coming next</h3>
                <p>
                  PDF, JPG, PNG and other supported formats will
                  be available in the next development milestone.
                </p>
              </div>
            </section>

            <section className="panel activity-panel">
              <h3>Investigation activity</h3>
              <p className="panel-description">
                Your recent investigation activity will appear here.
              </p>
              <div className="empty-activity">
                <span>◷</span>
                <p>No activity yet</p>
              </div>
            </section>
          </div>

          <div className="notice">
            <strong>Evidence-first analysis</strong>
            <p>
              DocuTrace AI identifies potential anomalies and
              contextual inconsistencies. Findings require human
              verification and are not proof of fraud.
            </p>
          </div>

          <footer>
            DocuTrace AI · AI-Powered Document Forensics
          </footer>
        </section>
      </main>
    </div>
  );
}

export default App;
