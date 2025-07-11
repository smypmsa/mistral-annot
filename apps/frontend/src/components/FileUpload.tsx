'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useProcessing } from '@/contexts/ProcessingContext';
import { ArrowUpTrayIcon, XMarkIcon, DocumentIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import config from '@/config';

export function FileUpload() {
  const { isProcessing, setProcessingState, resetState } = useProcessing();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const pdfs = acceptedFiles.filter(file => file.name.toLowerCase().endsWith('.pdf'));
    if (pdfs.length === 0) {
      setUploadError('Only PDF files are allowed');
      return;
    }
    setFiles(prev => [...prev, ...pdfs]);
    setUploadError(null);
  }, []);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFiles = async () => {
    if (files.length === 0) return;

    resetState();
    setProcessingState({ isProcessing: true, error: null });

    const newResults = [];

    for (const file of files) {
      setProcessingState({ currentFile: file.name });
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${config.apiUrl}/process/document`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Processing failed for ${file.name}`);
        }

        const result = await response.json();
        newResults.push({
          file: file,
          fileName: file.name,
          data: result.result,
        });
      } catch (error) {
        setProcessingState({
          isProcessing: false,
          error: error instanceof Error ? error.message : 'An error occurred',
        });
        return; // Stop processing if one file fails
      }
    }

    setProcessingState({
      isProcessing: false,
      results: newResults,
      currentFile: null,
      error: null,
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-primary/50 hover:bg-secondary/50'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2">
          <ArrowUpTrayIcon className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">
            {isDragActive
              ? 'Drop the PDF files here'
              : 'Drag and drop PDF files here, or click to select files'}
          </p>
        </div>
      </div>

      {uploadError && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{uploadError}</p>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-4 space-y-4">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <DocumentIcon className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm truncate max-w-[200px]">{file.name}</span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-secondary rounded"
              >
                <XMarkIcon className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ))}

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setFiles([])}
              className="px-3 py-1 text-sm rounded hover:bg-secondary"
            >
              Clear all
            </button>
            <button
              onClick={processFiles}
              disabled={isProcessing}
              className="px-3 py-1 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Process files'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
