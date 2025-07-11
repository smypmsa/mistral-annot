import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface ProcessedResult {
  file: File | Blob;
  data: any;
}

interface ProcessingState {
  isProcessing: boolean;
  currentFile: string | null;
  result: ProcessedResult | null;
  error: string | null;
}

interface ProcessingContextType extends ProcessingState {
  setProcessingState: (state: Partial<ProcessingState>) => void;
  resetState: () => void;
}

const ProcessingContext = createContext<ProcessingContextType | undefined>(undefined);

const initialState: ProcessingState = {
  isProcessing: false,
  currentFile: null,
  result: null,
  error: null,
};

export function ProcessingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProcessingState>(initialState);

  const setProcessingState = (newState: Partial<ProcessingState>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  const resetState = () => {
    // Clean up any existing blob URLs
    if (state.result?.file instanceof Blob) {
      URL.revokeObjectURL(URL.createObjectURL(state.result.file));
    }
    setState(initialState);
  };

  return (
    <ProcessingContext.Provider value={{ ...state, setProcessingState, resetState }}>
      {children}
    </ProcessingContext.Provider>
  );
}

export function useProcessing() {
  const context = useContext(ProcessingContext);
  if (context === undefined) {
    throw new Error('useProcessing must be used within a ProcessingProvider');
  }
  return context;
}
