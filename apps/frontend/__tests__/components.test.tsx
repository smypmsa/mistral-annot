import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FileUpload } from '@/components/FileUpload'
import { Results } from '@/components/Results'
import { ProcessingProvider } from '@/contexts/ProcessingContext'

// Mock the fetch function
global.fetch = jest.fn()

describe('FileUpload Component', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('renders upload area', () => {
    render(
      <ProcessingProvider>
        <FileUpload />
      </ProcessingProvider>
    )
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument()
  })

  it('handles file upload', async () => {
    // Mock successful responses
    global.fetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ filename: 'test.pdf' }),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: { test: 'data' } }),
        })
      )

    render(
      <ProcessingProvider>
        <FileUpload />
      </ProcessingProvider>
    )

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    const input = screen.getByRole('button')
    
    await waitFor(() => {
      fireEvent.change(input, { target: { files: [file] } })
    })

    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
})

describe('Results Component', () => {
  it('shows loading state', () => {
    render(
      <ProcessingProvider>
        <Results />
      </ProcessingProvider>
    )
    expect(screen.getByText(/processing/i)).toBeInTheDocument()
  })

  it('displays results when available', () => {
    const testData = { invoice: { total: 100 } }
    render(
      <ProcessingProvider initialState={{ isProcessing: false, result: testData }}>
        <Results />
      </ProcessingProvider>
    )
    expect(screen.getByText(/extracted data/i)).toBeInTheDocument()
    expect(screen.getByText(JSON.stringify(testData, null, 2))).toBeInTheDocument()
  })

  it('displays error message', () => {
    render(
      <ProcessingProvider initialState={{ isProcessing: false, error: 'Test error' }}>
        <Results />
      </ProcessingProvider>
    )
    expect(screen.getByText(/error/i)).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
  })
})
