from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from core.extractor import DocumentExtractor
from pathlib import Path
import tempfile
import os
import shutil

app = FastAPI(
    title="Invoice Parser API",
    description="API for parsing invoices using Mistral AI",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Invoice Parser API is running"}

async def save_upload_file(upload_file: UploadFile) -> Path:
    try:
        suffix = Path(upload_file.filename).suffix
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(upload_file.file, tmp)
            return Path(tmp.name)
    finally:
        upload_file.file.close()

async def cleanup_temp_file(file_path: Path):
    try:
        os.unlink(file_path)
    except Exception:
        pass

@app.post("/process/document")
async def process_single_document(file: UploadFile = File(...)):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    temp_file_path = await save_upload_file(file)
    
    try:
        extractor = DocumentExtractor()
        result = extractor.process_document(temp_file_path)
        return {
            "status": "success",
            "filename": file.filename,
            "result": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await cleanup_temp_file(temp_file_path)

@app.post("/process/documents")
async def process_multiple_documents(files: list[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")
    
    results = []
    extractor = DocumentExtractor()
    
    for file in files:
        if not file.filename.lower().endswith('.pdf'):
            continue
            
        temp_file_path = await save_upload_file(file)
        
        try:
            result = extractor.process_document(temp_file_path)
            results.append({
                "filename": file.filename,
                "result": result
            })
        except Exception as e:
            results.append({
                "filename": file.filename,
                "error": str(e)
            })
        finally:
            await cleanup_temp_file(temp_file_path)
    
    return {
        "status": "success",
        "total_processed": len(results),
        "results": results
    }