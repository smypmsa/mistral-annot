declare module 'react-pdf' {
  import { ComponentType, ReactElement } from 'react';

  export interface DocumentProps {
    file: string | File | Blob;
    onLoadSuccess?: (pdf: { numPages: number }) => void;
    onLoadError?: (error?: Error) => void;
    className?: string;
    children?: ReactElement | ReactElement[];
    loading?: ReactElement;
    error?: ReactElement;
  }

  export interface PageProps {
    pageNumber: number;
    renderTextLayer?: boolean;
    renderAnnotationLayer?: boolean;
    className?: string;
    scale?: number;
    loading?: ReactElement;
    error?: ReactElement;
  }

  export const Document: ComponentType<DocumentProps>;
  export const Page: ComponentType<PageProps>;
  export const pdfjs: {
    GlobalWorkerOptions: {
      workerSrc: string;
      workerPort?: any;
    };
    version: string;
  };
}
