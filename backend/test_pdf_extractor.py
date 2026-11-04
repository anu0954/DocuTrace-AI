from app.extraction.pdf_extractor import extract_text_from_pdf
pdf_path = "uploads/cfb14f4d-6ebd-49cd-ab60-c7cbcd2744d4.pdf"

result = extract_text_from_pdf(pdf_path)

print("PDF Extraction Successful!")
print("Filename:", result["filename"])
print("Total Pages:", result["total_pages"])

for page in result["pages"]:
    print(f"\n--- Page {page['page_number']} ---")
    print(page["text"])