'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import type { PDFDocumentProxy } from 'pdfjs-dist';

// Import required CSS for text and annotation layers
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

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
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.0);
  const [containerWidth, setContainerWidth] = useState<number>(800);

  // Responsive width adjustment
  useEffect(() => {
    const updateWidth = () => {
      const container = document.querySelector('.pdf-container');
      if (container) {
        setContainerWidth(Math.min(container.clientWidth - 32, 1200)); // Max width 1200px
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

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

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setScale(prev => Math.max(0.5, prev - 0.2));
  const handleResetZoom = () => setScale(1.0);

  const goToPrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(numPages, prev + 1));
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(numPages);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.key) {
        case 'ArrowLeft':
          goToPrevPage();
          break;
        case 'ArrowRight':
          goToNextPage();
          break;
        case 'Home':
          goToFirstPage();
          break;
        case 'End':
          goToLastPage();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          handleResetZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [numPages]);

  if (typeof window === 'undefined') {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="w-full p-8 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header with page info */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {!isLoading && (
            <>
              Page {currentPage} of {numPages}
            </>
          )}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-500">
          Use arrow keys to navigate, +/- to zoom
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="flex items-center justify-between flex-wrap gap-4 p-4">
          {/* Page Navigation */}
          <div className="flex items-center gap-2">
            <button 
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="First page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Previous page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <input
              type="number"
              min="1"
              max={numPages}
              value={currentPage}
              onChange={(e) => setCurrentPage(Math.min(Math.max(1, parseInt(e.target.value) || 1), numPages))}
              className="w-16 px-2 py-1 text-center border dark:border-gray-600 rounded-md dark:bg-gray-700"
            />
            
            <button 
              onClick={goToNextPage}
              disabled={currentPage === numPages}
              className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Next page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button 
              onClick={goToLastPage}
              disabled={currentPage === numPages}
              className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Last page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handleZoomOut} 
              disabled={scale <= 0.5}
              className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Zoom out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <button
              onClick={handleResetZoom}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Reset zoom"
            >
              {(scale * 100).toFixed(0)}%
            </button>
            <button 
              onClick={handleZoomIn}
              disabled={scale >= 3}
              className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Zoom in"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-grow w-full overflow-auto p-4 pdf-container">
        <div className="flex flex-col items-center">
          {isLoading && <LoadingSpinner />}
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            className="max-w-full"
            loading={<LoadingSpinner />}
            error={
              <div className="p-8 text-center text-red-600 dark:text-red-400">
                <svg className="w-12 h-12 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Failed to load PDF
              </div>
            }
          >
            <Page
              pageNumber={currentPage}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-xl overflow-hidden bg-white"
              scale={scale}
              width={containerWidth}
              loading={<LoadingSpinner />}
              error={
                <div className="p-4 text-center text-red-600 dark:text-red-400">
                  Failed to load page
                </div>
              }
            />
          </Document>
        </div>
      </div>
    </div>
  );
}