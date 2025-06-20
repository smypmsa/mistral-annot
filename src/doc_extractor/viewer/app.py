import streamlit as st
import json
from pathlib import Path
from PIL import Image
import io
from doc_extractor.config import Config

def load_results():
    results = []
    for json_path in Config.OUTPUT_DIR.glob("*.json"):
        with open(json_path) as f:
            results.append(json.load(f))
    return results

def display_document(doc_path):
    if not doc_path.exists():
        st.error("Original document not found")
        return
    
    file_ext = doc_path.suffix.lower()
    
    if file_ext == '.pdf':
        try:
            import fitz
            
            doc = fitz.open(str(doc_path))
            
            page = doc[0]
            pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))
            img_data = pix.tobytes("png")
            
            image = Image.open(io.BytesIO(img_data))
            st.image(image, use_column_width=True)
            
            st.caption(f"📄 Page 1 of {len(doc)} | Size: {page.rect.width:.0f}x{page.rect.height:.0f}pt")
            
            doc.close()
            
        except ImportError:
            st.error("❌ PyMuPDF not installed")
            st.info("Install with: `uv add pymupdf`")
            st.write(f"**File:** {doc_path.name}")
            
        except Exception as e:
            st.error(f"Error displaying PDF: {e}")
            st.write(f"**File:** {doc_path.name}")
    
    elif file_ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp']:
        try:
            image = Image.open(doc_path)
            st.image(image, use_column_width=True)
            st.caption(f"🖼️ Image: {image.size[0]}x{image.size[1]} pixels")
        except Exception as e:
            st.error(f"Error displaying image: {e}")
    else:
        st.warning(f"Unsupported file type: {file_ext}")

def main():
    st.title("📄 Document Extraction Viewer")
    
    try:
        import fitz
        st.sidebar.success("✅ PyMuPDF available")
    except ImportError:
        st.sidebar.error("❌ PyMuPDF not available")
        st.sidebar.info("Run: `uv add pymupdf`")
    
    results = load_results()
    
    if not results:
        st.warning("No extraction results found. Run the extractor first.")
        return
    
    doc_names = [Path(r["source_file"]).stem for r in results]
    selected_doc = st.sidebar.selectbox("Select Document", doc_names)
    
    result = next(r for r in results if Path(r["source_file"]).stem == selected_doc)
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Document")
        doc_path = Path(result["source_file"])
        display_document(doc_path)
    
    with col2:
        st.subheader("Extracted Invoice Data")
        
        # Display extracted invoice fields prominently
        skip_fields = {"source_file", "ocr_text", "error", "bbox_annotations", "extraction_method", "total_regions"}
        for key, value in result.items():
            if key not in skip_fields and value:
                st.text_input(key.replace("_", " ").title(), str(value), disabled=True)
        
        # Display line items prominently if available
        if "line_items" in result and result["line_items"]:
            st.subheader("Line Items")
            st.text_area("All Line Items", result["line_items"], height=150, disabled=True)
        
        st.subheader("Visual Regions Analysis")
        
        if "total_regions" in result:
            st.metric("Total Visual Regions Detected", result["total_regions"])
        
        if "bbox_annotations" in result and result["bbox_annotations"]:
            for i, bbox in enumerate(result["bbox_annotations"], 1):
                annotation = bbox.get('annotation', {})
                image_type = annotation.get('image_type', 'unknown')
                description = annotation.get('description', 'N/A')
                
                type_colors = {
                    'graph': '📊',
                    'text': '📝',
                    'table': '📋',
                    'image': '🖼️'
                }
                icon = type_colors.get(image_type, '⬛')
                
                with st.expander(f"{icon} Visual Region {i}: {image_type.title()}"):
                    st.write(f"**Type:** {image_type}")
                    st.write(f"**Description:** {description}")
                    
                    if "bbox_coordinates" in bbox:
                        coords = bbox["bbox_coordinates"]
                        st.write(f"**Position:** ({coords['top_left_x']}, {coords['top_left_y']}) to ({coords['bottom_right_x']}, {coords['bottom_right_y']})")
                    
                    st.json(annotation)
        else:
            st.info("No visual regions detected in this document.")
        
        if "extraction_method" in result:
            st.success(f"✅ Extraction method: {result['extraction_method']}")
        
        if "ocr_text" in result:
            st.subheader("OCR Text")
            st.text_area("Full Text", result["ocr_text"], height=200, disabled=True)
        
        if "error" in result:
            st.error(f"Error: {result['error']}")
            if "raw_annotation" in result:
                st.subheader("Raw Response")
                st.text_area("Raw", result["raw_annotation"], disabled=True)
        
        st.subheader("Raw JSON")
        st.json(result)

if __name__ == "__main__":
    main()