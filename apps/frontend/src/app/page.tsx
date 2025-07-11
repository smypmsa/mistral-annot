'use client';

import { FileUpload } from '@/components/FileUpload';
import { Results } from '@/components/Results';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ProcessingProvider } from '@/contexts/ProcessingContext';

export default function Home() {
  return (
    <ProcessingProvider>
      <main className="min-h-screen p-8 bg-background text-foreground transition-colors">
        <ThemeToggle />
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            Mistral Invoice Parser
          </h1>
          <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
            <FileUpload />
          </div>
          <div className="mt-8">
            <Results />
          </div>
        </div>
      </main>
    </ProcessingProvider>
  );
}
