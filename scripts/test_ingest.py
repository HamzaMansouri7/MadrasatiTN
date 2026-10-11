import os
import json
import base64
import time
import urllib.request
import fitz  # PyMuPDF
from pathlib import Path

# Load env keys
ENV_PATH = Path('.env')
GEMINI_KEYS = []
if ENV_PATH.exists():
    with open(ENV_PATH, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line.startswith(('GEMINI_API_KEY=', 'GEMINI_API_KEY_2=', 'GEMINI_API_KEY_3=')):
                k = line.split('=', 1)[1].strip().strip('"').strip("'")
                if k:
                    GEMINI_KEYS.append(k)

print(f"Loaded {len(GEMINI_KEYS)} Gemini keys.")

def render_page_to_jpeg_bytes(pdf_path, page_idx, dpi=200):
    doc = fitz.open(pdf_path)
    page = doc[page_idx]
    pix = page.get_pixmap(dpi=dpi)
    img_bytes = pix.tobytes("jpeg")
    doc.close()
    return img_bytes

# Test rendering page 0 of Sagesse
sample_pdf = 'parascolaire/6eme/francais/Sagesse_6eme_Complet.pdf'
if os.path.exists(sample_pdf):
    data = render_page_to_jpeg_bytes(sample_pdf, 0)
    print(f"Rendered page 0: {len(data)} bytes.")
else:
    print(f"PDF not found: {sample_pdf}")
