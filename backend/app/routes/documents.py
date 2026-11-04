from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
from datetime import datetime, timezone
import shutil
import uuid
import hashlib

from app.database.db import get_connection
from app.extraction.pdf_extractor import extract_text_from_pdf

router = APIRouter(prefix="/api/documents", tags=["Documents"])

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".png", ".jpg", ".jpeg"}


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Filename is missing"
        )

    file_extension = Path(file.filename).suffix.lower()

    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Upload PDF, DOCX, PNG or JPG."
        )

    document_id = str(uuid.uuid4())
    safe_filename = f"{document_id}{file_extension}"
    file_path = UPLOAD_DIR / safe_filename

    try:
        # Save uploaded document
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = file_path.stat().st_size

        # Calculate SHA-256 hash
        sha256_hash = hashlib.sha256()

        with file_path.open("rb") as saved_file:
            for chunk in iter(lambda: saved_file.read(4096), b""):
                sha256_hash.update(chunk)

        file_hash = sha256_hash.hexdigest()
        uploaded_at = datetime.now(timezone.utc).isoformat()

        # Save document metadata in SQLite
        connection = get_connection()

        try:
            connection.execute(
                """
                INSERT INTO documents (
                    document_id,
                    original_filename,
                    stored_filename,
                    file_extension,
                    file_size,
                    file_hash,
                    uploaded_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    document_id,
                    file.filename,
                    safe_filename,
                    file_extension,
                    file_size,
                    file_hash,
                    uploaded_at
                )
            )

            connection.commit()

        finally:
            connection.close()

    except Exception as error:
        # Remove file only if the upload/database operation failed
        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail=f"Document upload failed: {str(error)}"
        )

    # Automatically extract text from PDFs
    extraction_status = "not_applicable"
    extracted_pages_count = 0
    extraction_error = None

    if file_extension == ".pdf":

        try:
            result = extract_text_from_pdf(str(file_path))

            connection = get_connection()

            try:
                for page in result["pages"]:
                    connection.execute(
                        """
                        INSERT INTO extracted_pages (
                            document_id,
                            page_number,
                            extracted_text
                        )
                        VALUES (?, ?, ?)
                        ON CONFLICT(document_id, page_number)
                        DO UPDATE SET
                            extracted_text = excluded.extracted_text
                        """,
                        (
                            document_id,
                            page["page_number"],
                            page["text"]
                        )
                    )

                connection.commit()

            finally:
                connection.close()

            extracted_pages_count = len(result["pages"])
            extraction_status = "completed"

        except Exception as error:
            extraction_status = "failed"
            extraction_error = str(error)

    response = {
        "message": "Document uploaded successfully",
        "document_id": document_id,
        "original_filename": file.filename,
        "stored_filename": safe_filename,
        "file_extension": file_extension,
        "file_size": file_size,
        "file_hash": file_hash,
        "uploaded_at": uploaded_at,
        "status": "uploaded",
        "extraction_status": extraction_status,
        "extracted_pages": extracted_pages_count,
        "extraction_error": extraction_error
    }

    await file.close()
    return response


@router.get("/")
def list_documents():

    connection = get_connection()

    try:
        rows = connection.execute(
            """
            SELECT *
            FROM documents
            ORDER BY uploaded_at DESC
            """
        ).fetchall()

        documents = [dict(row) for row in rows]

        return {
            "total_documents": len(documents),
            "documents": documents
        }

    finally:
        connection.close()