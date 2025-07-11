'use client';

import { useProcessing } from '@/contexts/ProcessingContext';

export function Results() {
  const { isProcessing, result, error } = useProcessing();

  if (isProcessing) {
    return (
      <div className="w-full max-w-xl mx-auto mt-8 p-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3">Processing...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-xl mx-auto mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-semibold">Error</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="w-full max-w-xl mx-auto mt-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Extracted Data</h2>
        <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}
