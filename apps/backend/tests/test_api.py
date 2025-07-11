import pytest
from fastapi.testclient import TestClient
from pathlib import Path
import json
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Invoice Parser API is running"}

def test_upload_non_pdf():
    # Test uploading a non-PDF file
    files = {"file": ("test.txt", "test content", "text/plain")}
    response = client.post("/process/document", files=files)
    assert response.status_code == 400
    assert "Only PDF files are supported" in response.json()["detail"]

def test_upload_and_process():
    # Test uploading a valid PDF file
    test_pdf_path = Path("../../data/input/sample-invoice.pdf")
    if not test_pdf_path.exists():
        pytest.skip("Test PDF file not found")
    
    with open(test_pdf_path, "rb") as f:
        files = {"file": ("sample-invoice.pdf", f, "application/pdf")}
        response = client.post("/process/document", files=files)
        assert response.status_code == 200

def test_multiple_documents():
    # Test processing multiple PDF files
    pdf1_path = Path("../../data/input/sample-invoice.pdf")
    pdf2_path = Path("../../data/input/wordpress-pdf-invoice-plugin-sample.pdf")
    
    if not pdf1_path.exists() or not pdf2_path.exists():
        pytest.skip("Test PDF files not found")
    
    with open(pdf1_path, "rb") as f1, open(pdf2_path, "rb") as f2:
        files = [
            ("files", ("sample-invoice.pdf", f1, "application/pdf")),
            ("files", ("wordpress-pdf-invoice-plugin-sample.pdf", f2, "application/pdf"))
        ]
        response = client.post("/process/documents", files=files)
        assert response.status_code == 200
