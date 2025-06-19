from mistralai import Mistral
from pathlib import Path
import json
import base64
from typing import Dict, Any, List
from pydantic import BaseModel, Field
from enum import Enum
from doc_extractor.config import Config

# Try to import response_format_from_pydantic_model if available
try:
    from mistralai.models.chat_completion import response_format_from_pydantic_model
    HAS_RESPONSE_FORMAT_HELPER = True
except ImportError:
    HAS_RESPONSE_FORMAT_HELPER = False

class BboxType(str, Enum):
    TABLE = "table"
    TEXT = "text" 
    AMOUNT = "amount"
    DATE = "date"

class BboxAnnotation(BaseModel):
    model_config = {"extra": "forbid"}
    
    type: BboxType = Field(..., description="Type of content in this region")
    content: str = Field(..., description="Extracted text content from this region")
    confidence: str = Field(..., description="Confidence level: high, medium, low")

class LineItem(BaseModel):
    model_config = {"extra": "forbid"}
    
    description: str = Field(..., description="Description of the item or service")
    quantity: str = Field(..., description="Quantity or amount")
    unit_price: str = Field(..., description="Price per unit")
    total_price: str = Field(..., description="Total price for this line item")

class InvoiceData(BaseModel):
    model_config = {"extra": "forbid"}  # This adds additionalProperties: false
    
    invoice_number: str = Field(..., description="Invoice number or ID")
    date: str = Field(..., description="Invoice date")
    total_amount: str = Field(..., description="Total amount to pay") 
    vendor_name: str = Field(..., description="Vendor/supplier name")
    vendor_address: str = Field(..., description="Vendor address")
    line_items: List[LineItem] = Field(..., description="List of all items with quantities and prices")

class DocumentExtractor:
    def __init__(self):
        if not Config.MISTRAL_API_KEY:
            raise ValueError("MISTRAL_API_KEY not found in environment variables!")
        
        self.client = Mistral(api_key=Config.MISTRAL_API_KEY)
        self.config = Config()
        print(f"✓ Extractor initialized with API key: {Config.MISTRAL_API_KEY[:8]}...")
        print(f"✓ Input directory: {Config.INPUT_DIR}")
        print(f"✓ Output directory: {Config.OUTPUT_DIR}")
        print(f"✓ Response format helper: {HAS_RESPONSE_FORMAT_HELPER}")
    
    def encode_document(self, doc_path: Path) -> str:
        """Encode document to base64"""
        with open(doc_path, "rb") as doc_file:
            return base64.b64encode(doc_file.read()).decode('utf-8')
    
    def get_response_format(self, model_class):
        """Create response format from Pydantic model"""
        if HAS_RESPONSE_FORMAT_HELPER:
            return response_format_from_pydantic_model(model_class)
        
        # Fallback manual implementation
        schema = model_class.model_json_schema()
        # Ensure additionalProperties is set to False at the root level
        schema["additionalProperties"] = False
        
        # Also ensure it's set for nested objects
        def add_additional_properties_false(obj):
            if isinstance(obj, dict):
                if "type" in obj and obj["type"] == "object":
                    obj["additionalProperties"] = False
                for value in obj.values():
                    add_additional_properties_false(value)
        
        add_additional_properties_false(schema)
        
        return {
            "type": "json_schema",
            "json_schema": {
                "name": model_class.__name__,
                "schema": schema,
                "strict": True
            }
        }
    
    def extract_from_document(self, doc_path: Path) -> Dict[str, Any]:
        """Extract data using BOTH document and bbox annotations"""
        try:
            base64_doc = self.encode_document(doc_path)
            print(f"  → Document encoded, size: {len(base64_doc)} chars")
            
            # Get response formats for both annotation types
            doc_format = self.get_response_format(InvoiceData)
            bbox_format = self.get_response_format(BboxAnnotation)
            
            # Use OCR API with BOTH annotation types
            response = self.client.ocr.process(
                model="mistral-ocr-latest",
                pages=list(range(8)),  # Limit to 8 pages
                document={
                    "type": "document_url",
                    "document_url": f"data:application/pdf;base64,{base64_doc}"
                },
                document_annotation_format=doc_format,
                bbox_annotation_format=bbox_format,
                include_image_base64=False
            )
            
            print(f"  → OCR response received")
            
            # Parse document annotation (structured data)
            try:
                doc_result = json.loads(response.document_annotation)
            except json.JSONDecodeError as e:
                print(f"  → Document annotation parsing failed: {e}")
                doc_result = {"error": "Failed to parse document annotation"}
            
            # Extract bbox annotations (regional data)
            bbox_data = []
            for page in response.pages:
                for image in page.images:
                    try:
                        bbox_annotation = json.loads(image.image_annotation)
                        bbox_data.append({
                            "id": image.id,
                            "annotation": bbox_annotation,
                            "has_image": bool(image.image_base64)
                        })
                    except json.JSONDecodeError:
                        pass
            
            # Combine results
            result = {
                **doc_result,
                "source_file": str(doc_path),
                "ocr_text": "\n".join([page.markdown for page in response.pages]),
                "bbox_annotations": bbox_data,
                "extraction_method": "document + bbox"
            }
            
            return result
                
        except Exception as e:
            print(f"  → OCR API call failed: {e}")
            return {"error": str(e), "source_file": str(doc_path)}
    
    def process_folder(self) -> None:
        """Process all PDF documents in input folder"""
        Config.OUTPUT_DIR.mkdir(exist_ok=True)
        
        # Check if input directory exists
        if not Config.INPUT_DIR.exists():
            print(f"Error: Input directory {Config.INPUT_DIR} does not exist!")
            return
        
        # Find PDF documents (avoid duplicates on case-insensitive filesystems)
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
                
                # Save result
                output_path = Config.OUTPUT_DIR / f"{doc_path.stem}.json"
                with open(output_path, 'w') as f:
                    json.dump(result, f, indent=2)
                
                print(f"✓ Saved: {output_path.name}")
                
            except Exception as e:
                print(f"✗ Error processing {doc_path.name}: {e}")