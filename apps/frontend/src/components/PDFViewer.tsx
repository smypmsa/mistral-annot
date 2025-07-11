'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import type { PDFDocumentProxy } from 'pdfjs-dist';

// Dynamically import react-pdf components with no SSR
const Document = dynamic(() => import('react-pdf').then(mod => mod.Document), {
  ssr: false,
  loading: () => <LoadingSpinner />
});
const Page = dynamic(() => import('react-pdf').then(mod => mod.Page), {
  ssr: false,
  loading: () => <LoadingSpinner />
});

// Initialize PDF.js worker with security configurations
import { pdfjs } from 'react-pdf';

// Only initialize the worker on the client side with security settings
if (typeof window !== 'undefined') {
  // Use CDN for more reliable worker loading
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface PDFViewerProps {
  fileUrl: string | File | Blob;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
}

export function PDFViewer({ 
  fileUrl, 
  maxFileSize = 10, // 10MB default
  allowedTypes = ['application/pdf']
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(1);
  const [pageNumber, setPageNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Security validation
  useEffect(() => {
    if (fileUrl instanceof File) {
      // Check file size
      if (fileUrl.size > maxFileSize * 1024 * 1024) {
        setError(`File size exceeds ${maxFileSize}MB limit`);
        return;
      }
      
      // Check file type
      if (!allowedTypes.includes(fileUrl.type)) {
        setError('Invalid file type. Only PDF files are allowed.');
        return;
      }
    }
    setError(null);
  }, [fileUrl, maxFileSize, allowedTypes]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  }

  function onDocumentLoadError(error?: Error) {
    console.error('PDF loading error:', error);
    setIsLoading(false);
    setError('Failed to load PDF. Please ensure the file is valid and not corrupted.');
  }

  if (typeof window === 'undefined') {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="w-full p-8 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] overflow-y-auto">
      <div className="flex flex-col items-center">
        {isLoading && <LoadingSpinner />}
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          className="max-w-full"
          loading={<LoadingSpinner />}
          error={
            <div className="p-4 text-center text-red-600">
              Failed to load PDF
            </div>
          }
        >
          <Page 
            pageNumber={pageNumber} 
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-lg rounded-lg overflow-hidden"
            scale={1.2}
            loading={<LoadingSpinner />}
            error={
              <div className="p-4 text-center text-red-600">
                Failed to load page
              </div>
            }
          />
        </Document>
        {numPages > 1 && (
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
              disabled={pageNumber <= 1}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {pageNumber} of {numPages}
            </span>
            <button
              onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
              disabled={pageNumber >= numPages}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
