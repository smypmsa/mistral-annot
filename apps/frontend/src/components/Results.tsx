'use client';

import { useProcessing } from '@/contexts/ProcessingContext';

export function Results() {
  const { isProcessing, currentFile, result, error } = useProcessing();

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

  if (!result) {
    return null;
  }

  return (
    <div className="w-full mx-auto rounded-xl border border-border bg-background p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Extracted Data</h2>
      <div className="rounded-lg bg-secondary/50 p-4">
        <pre className="overflow-auto max-h-96 text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}
