
const API_BASE_URL = "http://127.0.0.1:8000";

// Upload a document
export async function uploadDocument(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
        `${API_BASE_URL}/api/documents/upload`,
        {
            method: "POST",
            body: formData
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.detail || "Document upload failed");
    }

    return result;
}

// Retrieve uploaded documents
export async function getDocuments() {
    const response = await fetch(
        `${API_BASE_URL}/api/documents/`
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.detail || "Could not retrieve documents");
    }

    return result;
}

// Retrieve extracted text from a document
export async function getExtractedText(documentId) {
    const response = await fetch(
        `${API_BASE_URL}/api/documents/${documentId}/extracted-text`
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.detail || "Could not retrieve extracted text"
        );
    }

    return result;
}
