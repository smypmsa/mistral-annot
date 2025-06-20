[[Mistral Document AI API](https://docs.mistral.ai/capabilities/OCR/annotations/) provides good functionality out-of-the-box for extracting structured data from PDFs. However, displaying detected values directly on the PDF requires additional logic not provided by Mistral (and not implemented in this repo). The `bbox_annotation` feature is useful for documents containing images (charts, graphs, etc.)—it returns descriptions and coordinates—but cannot be used for field extraction. For structured field output, use `document_annotation`, though it doesn't return field coordinates.]

# Document Extractor

Invoice extraction using **Mistral Dcoument AI**.

## Setup

# Unix/Mac
uv sync
echo "MISTRAL_API_KEY=your_key_here" > .env
mkdir -p data/input data/output

# Windows
uv sync
echo MISTRAL_API_KEY=your_key_here > .env
mkdir data\input data\output

## Run

```bash
# Extract: data/input/*.pdf → data/output/*.json
doc-extract

# View results
streamlit run doc_extractor/viewer/app.py
```

Extracts: invoice numbers, dates, vendors, line items, totals.