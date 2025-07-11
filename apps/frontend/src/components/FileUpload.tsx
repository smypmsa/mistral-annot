'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useProcessing } from '@/contexts/ProcessingContext';

export function FileUpload() {
  const { setProcessingState } = useProcessing();
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Only PDF files are allowed');
      return;
    }

    setProcessingState({ isProcessing: true, error: null });
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/process/document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Processing failed');
      }

      const result = await response.json();
      
      setProcessingState({
        isProcessing: false,
        currentFile: result.filename,
        result: result.result,
        error: null,
      });
    } catch (error) {
      setProcessingState({
        isProcessing: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  }, [setProcessingState]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: false,
  });

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        {...getRootProps()}
        className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-blue-500">Drop the PDF file here</p>
        ) : (
          <div>
            <p className="mb-2">Drag and drop a PDF file here, or click to select</p>
            <p className="text-sm text-gray-500">Only PDF files are accepted</p>
          </div>
        )}
      </div>
      {uploadError && (
        <p className="mt-2 text-red-500 text-sm text-center">{uploadError}</p>
      )}
    </div>
  );
}
