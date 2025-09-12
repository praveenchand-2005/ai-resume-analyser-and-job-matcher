# parser.py - resume ingestion (PDF/DOCX/Image OCR)
import os
from pdfminer.high_level import extract_text
from docx import Document
from PIL import Image
import pytesseract
from pdf2image import convert_from_path

# ✅ Point pytesseract to your tesseract.exe
pytesseract.pytesseract.tesseract_cmd = r"C:\Users\svlku\OneDrive\Desktop\ai-resume-analyzer\tesseract.exe"

def extract_text_from_pdf(path):
    try:
        text = extract_text(path)
        if text and len(text.strip()) > 50:  # only accept if text is meaningful
            return text
    except Exception:
        pass
    # fallback using pdf2image + tesseract
    text = ""
    pages = convert_from_path(path, dpi=200)
    for p in pages:
        text += pytesseract.image_to_string(p)
    return text

def extract_text_from_docx(path):
    doc = Document(path)
    fullText = []
    for para in doc.paragraphs:
        fullText.append(para.text)
    return "\n".join(fullText)

def parse_resume(path):
    ext = os.path.splitext(path)[1].lower()
    if ext in ['.pdf']:
        return extract_text_from_pdf(path)
    elif ext in ['.docx', '.doc']:
        return extract_text_from_docx(path)
    else:
        return pytesseract.image_to_string(Image.open(path))
