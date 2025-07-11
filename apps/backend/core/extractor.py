from mistralai import Mistral
from pathlib import Path
import json
import base64
from typing import Dict, Any, List
from pydantic import BaseModel, Field
from enum import Enum
import logging
from config import Settings

try:
    from mistralai.extra import response_format_from_pydantic_model
    HAS_RESPONSE_FORMAT_HELPER = True
except ImportError:
    HAS_RESPONSE_FORMAT_HELPER = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ImageType(str, Enum):
    GRAPH = "graph"
    TEXT = "text"
    TABLE = "table"
    IMAGE = "image"

class Image(BaseModel):
    image_type: ImageType = Field(..., description="The type of the image. Must be one of 'graph', 'text', 'table' or 'image'.")
    description: str = Field(..., description="A description of the image.")
    
    model_config = {
        "extra": "forbid"
    }

class Invoice(BaseModel):
    invoice_number: str = Field(..., description="The invoice number or ID from the document")
    invoice_date: str = Field(..., description="The date of the invoice")
    vendor_name: str = Field(..., description="The name of the vendor or company issuing the invoice")
    customer_name: str = Field(..., description="The name of the customer or company receiving the invoice")
    total_amount: str = Field(..., description="The total amount to be paid")
    line_items: list[str] = Field(..., description="ALL line items from the invoice table including service descriptions, quantities, unit prices and totals. Extract EVERY row from the line items table, including items with zero amounts. Format each as 'Description - Amount'")
    description: str = Field(..., description="Brief description of what this region contains on the invoice")
    
    model_config = {
        "extra": "forbid"
    }

class DocumentExtractor:
    def __init__(self):
        self.config = Settings()
        if not self.config.MISTRAL_API_KEY:
            raise ValueError("MISTRAL_API_KEY not found in environment variables!")
        
        self.client = Mistral(api_key=self.config.MISTRAL_API_KEY)
        logger.info(f"✅ Extractor initialized with API key: {self.config.MISTRAL_API_KEY[:8]}...")
        logger.info(f"✅ Response format helper: {HAS_RESPONSE_FORMAT_HELPER}")
        logger.info(f"✅ Invoice-focused bbox annotation model loaded")
    
    def encode_document(self, doc_path: Path) -> str:
        """Convert a document file to base64 string."""
        with open(doc_path, "rb") as doc_file:
            return base64.b64encode(doc_file.read()).decode('utf-8')
    
    def get_response_format(self, model_class):
        """Get the response format for Mistral API based on a Pydantic model."""
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
    
    def process_document(self, doc_path: Path) -> Dict[str, Any]:
        """Process a document using Mistral's OCR API to extract invoice information and visual regions.
        
        Args:
            doc_path: Path to the PDF document
            
        Returns:
            Dictionary containing:
            - Structured invoice data
            - OCR text
            - Bounding box annotations for visual regions
            - Source file information
            - Total number of regions found
        
        Raises:
            Exception: If document processing fails
        """
        try:
            logger.info(f"Processing document: {doc_path.name}")
            base64_doc = self.encode_document(doc_path)
            logger.info(f"Document encoded, size: {len(base64_doc)} chars")
            
            # Get response formats for both document and bbox annotations
            bbox_format = self.get_response_format(Image)
            doc_format = self.get_response_format(Invoice)
            
            # Process document with OCR
            response = self.client.ocr.process(
                model="mistral-ocr-latest",
                pages=list(range(8)),  # Process first 8 pages
                document={
                    "type": "document_url",
                    "document_url": f"data:application/pdf;base64,{base64_doc}"
                },
                bbox_annotation_format=bbox_format,
                document_annotation_format=doc_format,
                include_image_base64=True
            )
            
            logger.info(f"OCR response received for: {doc_path.name}")
            
            # Parse document annotation (structured invoice data)
            try:
                doc_result = json.loads(response.document_annotation)
            except json.JSONDecodeError as e:
                logger.error(f"Document annotation parsing failed: {e}")
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
                        # Skip invalid bbox annotations silently
                        pass
            
            # Combine all results
            result = {
                **doc_result,
                "source_file": str(doc_path),
                "ocr_text": "\n".join([page.markdown for page in response.pages]),
                "bbox_annotations": bbox_data,
                "extraction_method": "document + bbox",
                "total_regions": len(bbox_data)
            }
            
            logger.info(f"Successfully extracted {len(bbox_data)} regions from {doc_path.name}")
            return result
                
        except Exception as e:
            logger.error(f"Error processing document {doc_path.name}: {str(e)}")
            return {"error": str(e), "source_file": str(doc_path)}