# Document Extractor

## Overview

Advanced invoice data extraction platform leveraging Mistral Document AI capabilities. Full-stack solution combining Python backend processing with modern web interface for structured document analysis.

## Technical Architecture

**Backend**: Python-based API server with Mistral Document AI integration  
**Frontend**: Next.js web application with real-time processing interface  
**Processing Engine**: Mistral Document AI with annotation capabilities

### AI Processing Capabilities
- **Document Annotation**: Structured field extraction without coordinate data
- **Bbox Annotation**: Image content analysis with coordinate mapping (charts, graphs)
- **Field Recognition**: Automated identification of standard invoice elements

## System Requirements

### Core Dependencies
1. **Node.js Runtime**: Version 18+ ([nodejs.org](https://nodejs.org/))
2. **Python Package Manager**: [uv](https://docs.astral.sh/uv/getting-started/installation/)
3. **Mistral API Access**: Active API key from [mistral.ai](https://mistral.ai)

### Installation Verification
```bash
node --version
npm --version
```

## Implementation

### Environment Configuration
1. **Repository Setup**:
   ```bash
   git clone https://github.com/smypmsa/mistral-annot.git
   cd mistral-annot
   ```

2. **API Configuration**:
   ```bash
   # Unix/macOS
   echo "MISTRAL_API_KEY=your_key_here" > .env
   mkdir -p data/input data/output

   # Windows
   echo MISTRAL_API_KEY=your_key_here > .env
   mkdir data\input data\output
   ```

3. **Backend Initialization**:
   ```bash
   cd apps/backend
   uv sync
   cd ../..
   ```

4. **Frontend Setup**:
   ```bash
   cd apps/frontend
   npm install
   cd ../..
   ```

### System Deployment

**Backend Service** (Terminal 1):
```bash
cd apps/backend
uv run main.py
```

**Frontend Interface** (Terminal 2):
```bash
cd apps/frontend
npm run dev
```

**Access Point**: [http://localhost:3000](http://localhost:3000)

## Data Extraction Capabilities

**Automated Field Recognition**:
- Invoice identification numbers
- Transaction dates and periods  
- Vendor and supplier information
- Itemized line entries
- Financial totals and calculations

## Validation Process

Sample documents provided in `data/input` directory for immediate testing and validation of extraction accuracy.

## Operational Benefits

Reduces manual data entry overhead while maintaining high accuracy standards for financial document processing workflows.
