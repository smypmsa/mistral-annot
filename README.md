> [!NOTE]  
> [Mistral Document AI API](https://docs.mistral.ai/capabilities/OCR/annotations/) provides good functionality out-of-the-box for extracting structured data from PDFs. However, displaying detected values directly on the PDF requires additional logic not provided by Mistral (and not implemented in this repo). The `bbox_annotation` feature is useful for documents containing images (charts, graphs, etc.)—it returns descriptions and coordinates—but cannot be used for field extraction. For structured field output, use `document_annotation`, though it doesn't return field coordinates.

# 📄 Document Extractor

> Extract structured data from invoices using **Mistral Document AI** - a modern full-stack application with Python backend and Next.js frontend.

## 🚀 Prerequisites

1. **📦 Node.js and npm**: 
   - Download and install from [nodejs.org](https://nodejs.org/) (version 18 or higher recommended)
   - Verify installation:
     ```bash
     node --version
     npm --version
     ```

2. **⚡ uv** (Python package manager):
   - Download and install from [Astral](https://docs.astral.sh/uv/getting-started/installation/)

3. **🔑 Mistral API Key**:
   - Sign up at [mistral.ai](https://mistral.ai)
   - Get your API key from the dashboard

## 🛠️ Setup

1. **📥 Clone the repository**:
   ```bash
   git clone https://github.com/smypmsa/mistral-annot.git
   cd mistral-annot
   ```

2. **⚙️ Configure environment**:
   ```bash
   # Unix/Mac
   echo "MISTRAL_API_KEY=your_key_here" > .env
   mkdir -p data/input data/output

   # Windows
   echo MISTRAL_API_KEY=your_key_here > .env
   mkdir data\input data\output
   ```

3. **🐍 Set up backend**:
   ```bash
   cd apps/backend
   uv sync
   cd ../..
   ```

4. **💻 Set up frontend**:
   ```bash
   cd apps/frontend
   npm install
   cd ../..
   ```

## 🚀 Running the Application

1. **🔧 Start the backend** (in a terminal):
   ```bash
   cd apps/backend
   uv run main.py
   ```

2. **🌐 Start the frontend** (in another terminal):
   ```bash
   cd apps/frontend
   npm run dev
   ```

3. **🎉 Access the app**:
   - Open your browser to [http://localhost:3000](http://localhost:3000)
   - Upload PDF invoices through the modern web interface
   - See the extracted data instantly

## ✨ Features

The application automatically extracts:
- 📝 Invoice numbers
- 📅 Dates
- 🏢 Vendor information
- 📋 Line items
- 💰 Total amounts

## 🧪 Try it out

Ready to test? Sample invoices are included in the `data/input` directory:
1. 🌐 Open [http://localhost:3000](http://localhost:3000) in your browser
2. 📤 Click the upload button
3. 📂 Select a sample PDF from `data/input`
4. ✨ Watch as the data is automatically extracted and displayed