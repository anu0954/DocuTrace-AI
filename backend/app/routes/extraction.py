from fastapi import APIRouter, HTTPException
from pathlib import Path

from app.database.db import get_connection
from app.extraction.pdf_extractor import extract_text_from_pdf

router = APIRouter(prefix="/api/documents", tags=["Extraction"])

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"


@router.post("/{document_id}/extract")
def extract_document_text(document_id: str):

    connection = get_connection()

    try:
        document = connection.execute(
            """
            SELECT *
            FROM documents
            WHERE document_id = ?
            """,
            (document_id,)
        ).fetchone()

    finally:
        connection.close()

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    if document["file_extension"] != ".pdf":
        raise HTTPException(
            status_code=400,
            detail="Text extraction currently supports PDF files only"
        )

    file_path = UPLOAD_DIR / document["stored_filename"]

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

        result["saved_pages"] = len(result["pages"])

        return result

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Text extraction failed: {str(error)}"
        )
@router.get("/{document_id}/extracted-text")
def get_extracted_text(document_id: str):

    connection = get_connection()

    try:
        pages = connection.execute(
            """
            SELECT page_number, extracted_text
            FROM extracted_pages
            WHERE document_id = ?
            ORDER BY page_number ASC
            """,
            (document_id,)
        ).fetchall()

        if not pages:
            raise HTTPException(
                status_code=404,
                detail="No extracted text found for this document"
            )

        return {
            "document_id": document_id,
            "total_pages": len(pages),
            "pages": [
                {
                    "page_number": page["page_number"],
                    "text": page["extracted_text"]
                }
                for page in pages
            ]
        }

    finally:
        connection.close()