import streamlit as st
import json
from pathlib import Path
from PIL import Image
import io
from doc_extractor.config import Config

def load_results():
    """Load all extraction results"""
    results = []
    for json_path in Config.OUTPUT_DIR.glob("*.json"):
        with open(json_path) as f:
            results.append(json.load(f))
    return results

def display_document(doc_path):
    """Display document (PDF or image) in Streamlit"""
    if not doc_path.exists():
        st.error("Original document not found")
        return
    
    file_ext = doc_path.suffix.lower()
    
    if file_ext == '.pdf':
        try:
            import fitz  # PyMuPDF
            
            # Open PDF with PyMuPDF
            doc = fitz.open(str(doc_path))
            
            # Convert first page to image
            page = doc[0]  # First page
            pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))  # 1.5x zoom for better quality
            img_data = pix.tobytes("png")
            
            # Convert to PIL Image and display
            image = Image.open(io.BytesIO(img_data))
            st.image(image, use_column_width=True)
            
            # Show page info
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
    
    # Check PyMuPDF availability
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
    
    # Sidebar for document selection
    doc_names = [Path(r["source_file"]).stem for r in results]
    selected_doc = st.sidebar.selectbox("Select Document", doc_names)
    
    # Find selected result
    result = next(r for r in results if Path(r["source_file"]).stem == selected_doc)
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Document")
        doc_path = Path(result["source_file"])
        display_document(doc_path)
    
    with col2:
        st.subheader("Extracted Data")
        
        # Display basic fields (skip metadata and line_items)
        skip_fields = {"source_file", "ocr_text", "error", "raw_annotation", "line_items", "bbox_annotations", "extraction_method"}
        for key, value in result.items():
            if key not in skip_fields:
                st.text_input(key.replace("_", " ").title(), str(value), disabled=True)
        
        # Display line items in a structured way
        if "line_items" in result and isinstance(result["line_items"], list):
            st.subheader("Line Items")
            for i, item in enumerate(result["line_items"], 1):
                st.write(f"**Item {i}:**")
                col_a, col_b = st.columns(2)
                with col_a:
                    st.text_input(f"Description {i}", item.get("description", ""), disabled=True, key=f"desc_{i}")
                    st.text_input(f"Quantity {i}", item.get("quantity", ""), disabled=True, key=f"qty_{i}")
                with col_b:
                    st.text_input(f"Unit Price {i}", item.get("unit_price", ""), disabled=True, key=f"unit_{i}")
                    st.text_input(f"Total Price {i}", item.get("total_price", ""), disabled=True, key=f"total_{i}")
                st.divider()
        elif "line_items" in result:
            # Fallback for string line_items
            st.subheader("Line Items")
            st.text_area("Items", str(result["line_items"]), disabled=True)
        
        # Display bbox annotations if available
        if "bbox_annotations" in result and result["bbox_annotations"]:
            st.subheader("Regional Analysis")
            for i, bbox in enumerate(result["bbox_annotations"], 1):
                with st.expander(f"Region {i} - {bbox['annotation'].get('type', 'unknown')}"):
                    st.write(f"**Type:** {bbox['annotation'].get('type', 'N/A')}")
                    st.write(f"**Content:** {bbox['annotation'].get('content', 'N/A')}")
                    st.write(f"**Confidence:** {bbox['annotation'].get('confidence', 'N/A')}")
        
        # Show extraction method
        if "extraction_method" in result:
            st.info(f"Extraction method: {result['extraction_method']}")
        
        # Show OCR text if available
        if "ocr_text" in result:
            st.subheader("OCR Text")
            st.text_area("Full Text", result["ocr_text"], height=200, disabled=True)
        
        # Show error details if present
        if "error" in result:
            st.error(f"Error: {result['error']}")
            if "raw_annotation" in result:
                st.subheader("Raw Response")
                st.text_area("Raw", result["raw_annotation"], disabled=True)
        
        st.subheader("Raw JSON")
        st.json(result)

if __name__ == "__main__":
    main()