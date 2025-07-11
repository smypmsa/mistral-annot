import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface ProcessedResult {
  file: File | Blob;
  fileName: string;
  data: any;
}

interface ProcessingState {
  isProcessing: boolean;
  results: ProcessedResult[];
  currentFile: string | null;
  error: string | null;
  activeResultIndex: number;
}

interface ProcessingContextType extends ProcessingState {
  setProcessingState: (state: Partial<ProcessingState>) => void;
  resetState: () => void;
  setActiveResultIndex: (index: number) => void;
}

const ProcessingContext = createContext<ProcessingContextType | undefined>(undefined);

const initialState: ProcessingState = {
  isProcessing: false,
  results: [],
  currentFile: null,
  error: null,
  activeResultIndex: 0,
};

export function ProcessingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProcessingState>(initialState);

  const setProcessingState = (newState: Partial<ProcessingState>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  const setActiveResultIndex = (index: number) => {
    setState((prev) => ({ ...prev, activeResultIndex: index }));
  };

  const resetState = () => {
    // Clean up any existing blob URLs
    state.results.forEach((result) => {
      if (result.file instanceof Blob) {
        URL.revokeObjectURL(URL.createObjectURL(result.file));
      }
    });
    setState(initialState);
  };

  return (
    <ProcessingContext.Provider
      value={{ ...state, setProcessingState, resetState, setActiveResultIndex }}
    >
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
