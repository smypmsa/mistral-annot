'use client';

import { FileUpload } from '@/components/FileUpload';
import { Results } from '@/components/Results';
import { ProcessingProvider } from '@/contexts/ProcessingContext';

export default function Home() {
  return (
    <ProcessingProvider>
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            Mistral Invoice Parser
          </h1>
          <FileUpload />
          <Results />
        </div>
      </main>
    </ProcessingProvider>
  );
}
