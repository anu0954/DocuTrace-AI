import pymupdf
from pathlib import Path


def extract_text_from_pdf(file_path: str):

    pdf_path = Path(file_path)

    if not pdf_path.exists():
        raise FileNotFoundError(
            f"PDF file not found: {file_path}"
        )

    document = pymupdf.open(pdf_path)

    extracted_pages = []

    for page_number, page in enumerate(document, start=1):

        page_text = page.get_text("text")

        extracted_pages.append({
            "page_number": page_number,
            "text": page_text.strip()
        })

    document.close()

    return {
        "filename": pdf_path.name,
        "total_pages": len(extracted_pages),
        "pages": extracted_pages
    }