'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useProcessing } from '@/contexts/ProcessingContext';
import { ArrowUpTrayIcon, XMarkIcon, DocumentIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import config from '@/config';

export function FileUpload() {
  const { isProcessing, setProcessingState } = useProcessing();
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

  const processFile = async (file: File) => {
    setProcessingState({ isProcessing: true, error: null, currentFile: file.name });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${config.apiUrl}/process/document`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Processing failed');
      }

      const result = await response.json();
      setProcessingState({
        isProcessing: false,
        currentFile: file.name,
        result: result.result,
        error: null,
      });
    } catch (error) {
      setProcessingState({
        isProcessing: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  const processAllFiles = async () => {
    setProcessingState({ isProcessing: true, error: null });

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`${config.apiUrl}/process/documents`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Processing failed');
      }

      const result = await response.json();
      setProcessingState({
        isProcessing: false,
        result: result.results,
        error: null,
      });
    } catch (error) {
      setProcessingState({
        isProcessing: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: true,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <ArrowUpTrayIcon className="h-8 w-8 text-primary/50" />
          <p className="text-sm">
            {isDragActive
              ? 'Drop PDF files here'
              : 'Drag and drop PDF files here, or click to select'}
          </p>
        </div>
      </div>

      {uploadError && (
        <p className="text-sm text-red-500 mt-2">{uploadError}</p>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Selected files:</h3>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
              >
                <div className="flex items-center space-x-3">
                  <DocumentIcon className="h-5 w-5 text-primary/70" />
                  <span className="text-sm truncate max-w-[200px]">
                    {file.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => processFile(file)}
                    disabled={isProcessing}
                    className="px-3 py-1 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    Process
                  </button>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 rounded-md hover:bg-secondary transition-colors"
                    aria-label="Remove file"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          
          {files.length > 1 && (
            <button
              onClick={processAllFiles}
              disabled={isProcessing}
              className="w-full mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Process All Files
            </button>
          )}
        </div>
      )}
    </div>
  );
}
