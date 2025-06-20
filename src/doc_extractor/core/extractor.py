from mistralai import Mistral
from pathlib import Path
import json
import base64
from typing import Dict, Any, List
from pydantic import BaseModel, Field
from enum import Enum
from doc_extractor.config import Config

try:
    from mistralai.extra import response_format_from_pydantic_model
    HAS_RESPONSE_FORMAT_HELPER = True
except ImportError:
    HAS_RESPONSE_FORMAT_HELPER = False

class ImageType(str, Enum):
    GRAPH = "graph"
    TEXT = "text"
    TABLE = "table"
    IMAGE = "image"

class Image(BaseModel):
    image_type: ImageType = Field(..., description="The type of the image. Must be one of 'graph', 'text', 'table' or 'image'.")
    description: str = Field(..., description="A description of the image.")

class Invoice(BaseModel):
    invoice_number: str = Field(..., description="The invoice number or ID from the document")
    invoice_date: str = Field(..., description="The date of the invoice")
    vendor_name: str = Field(..., description="The name of the vendor or company issuing the invoice")
    customer_name: str = Field(..., description="The name of the customer or company receiving the invoice")
    total_amount: str = Field(..., description="The total amount to be paid")
    line_items: list[str] = Field(..., description="ALL line items from the invoice table including service descriptions, quantities, unit prices and totals. Extract EVERY row from the line items table, including items with zero amounts. Format each as 'Description - Amount'")
    description: str = Field(..., description="Brief description of what this region contains on the invoice")

class DocumentExtractor:
    def __init__(self):
        if not Config.MISTRAL_API_KEY:
            raise ValueError("MISTRAL_API_KEY not found in environment variables!")
        
        self.client = Mistral(api_key=Config.MISTRAL_API_KEY)
        self.config = Config()
        print(f"✅ Extractor initialized with API key: {Config.MISTRAL_API_KEY[:8]}...")
        print(f"✅ Input directory: {Config.INPUT_DIR}")
        print(f"✅ Output directory: {Config.OUTPUT_DIR}")
        print(f"✅ Response format helper: {HAS_RESPONSE_FORMAT_HELPER}")
        print(f"✅ Invoice-focused bbox annotation model loaded")
    
    def encode_document(self, doc_path: Path) -> str:
        with open(doc_path, "rb") as doc_file:
            return base64.b64encode(doc_file.read()).decode('utf-8')
    
    def get_response_format(self, model_class):
        if HAS_RESPONSE_FORMAT_HELPER:
            return response_format_from_pydantic_model(model_class)
        
        schema = model_class.model_json_schema()
        
        return {
            "type": "json_schema",
            "json_schema": {
                "name": model_class.__name__,
                "schema": schema,
                "strict": True
            }
        }
    
    def extract_from_document(self, doc_path: Path) -> Dict[str, Any]:
        try:
            base64_doc = self.encode_document(doc_path)
            print(f"  → Document encoded, size: {len(base64_doc)} chars")
            
            bbox_format = self.get_response_format(Image)
            doc_format = self.get_response_format(Invoice)
            
            response = self.client.ocr.process(
                model="mistral-ocr-latest",
                pages=list(range(8)),
                document={
                    "type": "document_url",
                    "document_url": f"data:application/pdf;base64,{base64_doc}"
                },
                bbox_annotation_format=bbox_format,
                document_annotation_format=doc_format,
                include_image_base64=True
            )
            
            print(f"  → OCR response received")
            
            # Parse document annotation (structured invoice data)
            try:
                doc_result = json.loads(response.document_annotation)
            except json.JSONDecodeError as e:
                print(f"  → Document annotation parsing failed: {e}")
                doc_result = {"error": "Failed to parse document annotation"}
            
            # Extract bbox annotations (visual regions)
            bbox_data = []
            for page in response.pages:
                for image in page.images:
                    try:
                        bbox_annotation = json.loads(image.image_annotation)
                        bbox_data.append({
                            "id": image.id,
                            "bbox_coordinates": {
                                "top_left_x": image.top_left_x,
                                "top_left_y": image.top_left_y,
                                "bottom_right_x": image.bottom_right_x,
                                "bottom_right_y": image.bottom_right_y
                            },
                            "annotation": bbox_annotation,
                            "has_image": bool(image.image_base64)
                        })
                    except json.JSONDecodeError:
                        pass
            
            result = {
                **doc_result,
                "source_file": str(doc_path),
                "ocr_text": "\n".join([page.markdown for page in response.pages]),
                "bbox_annotations": bbox_data,
                "extraction_method": "document + bbox",
                "total_regions": len(bbox_data)
            }
            
            return result
                
        except Exception as e:
            print(f"  → OCR API call failed: {e}")
            return {"error": str(e), "source_file": str(doc_path)}
    
    def process_folder(self) -> None:
        Config.OUTPUT_DIR.mkdir(exist_ok=True)
        
        if not Config.INPUT_DIR.exists():
            print(f"Error: Input directory {Config.INPUT_DIR} does not exist!")
            return
        
        doc_paths = []
        for path in Config.INPUT_DIR.iterdir():
            if path.is_file() and path.suffix.lower() == '.pdf':
                doc_paths.append(path)
        
        if not doc_paths:
            print(f"No PDF documents found in {Config.INPUT_DIR}")
            return
        
        print(f"Found {len(doc_paths)} PDF documents to process")
        
        for doc_path in doc_paths:
            print(f"Processing: {doc_path.name}")
            
            try:
                result = self.extract_from_document(doc_path)
                
                output_path = Config.OUTPUT_DIR / f"{doc_path.stem}.json"
                with open(output_path, 'w') as f:
                    json.dump(result, f, indent=2)
                
                print(f"✅ Saved: {output_path.name}")
                
            except Exception as e:
                print(f"✗ Error processing {doc_path.name}: {e}")