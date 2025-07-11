'use client';

import { useProcessing } from '@/contexts/ProcessingContext';
import { PDFViewer } from './PDFViewer';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function Results() {
  const { isProcessing, currentFile, results, error, activeResultIndex, setActiveResultIndex } = useProcessing();

  if (isProcessing) {
    return (
      <div className="w-full max-w-xl mx-auto mt-8">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span>Processing {currentFile}...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-xl mx-auto mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
        <h3 className="text-red-500 font-semibold">Error</h3>
        <p className="text-red-400 mt-1">{error}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  const activeResult = results[activeResultIndex];
  if (!activeResult) {
    return null;
  }

  // Convert the Blob URL for PDF viewing
  const pdfUrl = activeResult.file instanceof Blob ? URL.createObjectURL(activeResult.file) : '';

  return (
    <div className="w-full mx-auto mt-8 space-y-6">
      {results.length > 1 && (
        <div className="flex justify-center">
          <select
            value={activeResultIndex}
            onChange={(e) => setActiveResultIndex(Number(e.target.value))}
            className="px-4 py-2 rounded-md border border-border bg-background text-foreground"
          >
            {results.map((result, index) => (
              <option key={index} value={index}>
                {result.fileName}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PDF Viewer */}
        <div className="w-full rounded-xl border border-border bg-background p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Original Document</h2>
          {pdfUrl && (
            <div className="mt-4 border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
              <PDFViewer fileUrl={pdfUrl} />
            </div>
          )}
        </div>

        {/* Extracted Data */}
        <div className="w-full rounded-xl border border-border bg-background p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Extracted Data</h2>
          <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 overflow-auto">
            <h3 className="text-lg font-semibold">Extraction Results</h3>
            <pre className="text-sm">
              <SyntaxHighlighter language="json" style={vscDarkPlus}>
                {JSON.stringify(activeResult.data, null, 2)}
              </SyntaxHighlighter>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
