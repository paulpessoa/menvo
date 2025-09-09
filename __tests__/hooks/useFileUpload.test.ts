import { renderHook, act } from '@testing-library/react'
import { useFileUpload, useImageUpload, usePDFUpload } from '@/hooks/useFileUpload'

// Mock XMLHttpRequest
const mockXHR = {
  open: jest.fn(),
  send: jest.fn(),
  setRequestHeader: jest.fn(),
  addEventListener: jest.fn(),
  upload: {
    addEventListener: jest.fn(),
  },
  status: 200,
  responseText: JSON.stringify({ url: 'https://example.com/file.jpg' }),
  abort: jest.fn(),
}

// @ts-ignore
global.XMLHttpRequest = jest.fn(() => mockXHR)

// Mock Supabase
const mockSupabase = {
  auth: {
    getSession: jest.fn(() => ({
      data: { session: { access_token: 'test-token' } },
    })),
  },
}

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}))

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    fileUpload: jest.fn(),
  },
}))

describe('useFileUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() =>
      useFileUpload({
        endpoint: '/api/upload/test',
      })
    )

    expect(result.current.progress).toBe(0)
    expect(result.current.isUploading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should validate file type', async () => {
    const { result } = renderHook(() =>
      useFileUpload({
        endpoint: '/api/upload/test',
        allowedTypes: ['image/jpeg'],
      })
    )

    const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' })

    await act(async () => {
      const uploadResult = await result.current.upload(invalidFile)
      expect(uploadResult.success).toBe(false)
      expect(uploadResult.error).toContain('tipo de arquivo não é permitido')
    })

    expect(result.current.error).toContain('tipo de arquivo não é permitido')
  })

  it('should validate file size', async () => {
    const { result } = renderHook(() =>
      useFileUpload({
        endpoint: '/api/upload/test',
        maxSize: 1024, // 1KB
      })
    )

    // Create a file larger than 1KB
    const largeContent = 'x'.repeat(2048)
    const largeFile = new File([largeContent], 'large.jpg', { type: 'image/jpeg' })

    await act(async () => {
      const uploadResult = await result.current.upload(largeFile)
      expect(uploadResult.success).toBe(false)
      expect(uploadResult.error).toContain('muito grande')
    })

    expect(result.current.error).toContain('muito grande')
  })

  it('should handle successful upload', async () => {
    const onSuccess = jest.fn()
    const onProgress = jest.fn()

    const { result } = renderHook(() =>
      useFileUpload({
        endpoint: '/api/upload/test',
        onSuccess,
        onProgress,
      })
    )

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })

    // Mock successful upload
    mockXHR.addEventListener.mockImplementation((event, callback) => {
      if (event === 'load') {
        setTimeout(() => callback(), 0)
      }
    })

    mockXHR.upload.addEventListener.mockImplementation((event, callback) => {
      if (event === 'progress') {
        setTimeout(() => callback({ lengthComputable: true, loaded: 50, total: 100 }), 0)
      }
    })

    await act(async () => {
      const uploadResult = await result.current.upload(file)
      expect(uploadResult.success).toBe(true)
    })

    expect(onSuccess).toHaveBeenCalled()
    expect(result.current.progress).toBe(100)
    expect(result.current.isUploading).toBe(false)
  })

  it('should handle upload error', async () => {
    const onError = jest.fn()

    const { result } = renderHook(() =>
      useFileUpload({
        endpoint: '/api/upload/test',
        onError,
      })
    )

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })

    // Mock error response
    mockXHR.status = 400
    mockXHR.responseText = JSON.stringify({ error: 'Upload failed' })
    mockXHR.addEventListener.mockImplementation((event, callback) => {
      if (event === 'load') {
        setTimeout(() => callback(), 0)
      }
    })

    await act(async () => {
      const uploadResult = await result.current.upload(file)
      expect(uploadResult.success).toBe(false)
    })

    expect(onError).toHaveBeenCalledWith('Upload failed')
    expect(result.current.error).toBe('Upload failed')
  })

  it('should handle upload cancellation', async () => {
    const { result } = renderHook(() =>
      useFileUpload({
        endpoint: '/api/upload/test',
      })
    )

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })

    act(() => {
      result.current.upload(file)
    })

    act(() => {
      result.current.cancel()
    })

    expect(mockXHR.abort).toHaveBeenCalled()
    expect(result.current.isUploading).toBe(false)
    expect(result.current.progress).toBe(0)
  })

  it('should reset state', () => {
    const { result } = renderHook(() =>
      useFileUpload({
        endpoint: '/api/upload/test',
      })
    )

    // Set some state
    act(() => {
      result.current.upload(new File(['content'], 'test.jpg', { type: 'image/jpeg' }))
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.progress).toBe(0)
    expect(result.current.isUploading).toBe(false)
    expect(result.current.error).toBeNull()
  })
})

describe('useImageUpload', () => {
  it('should configure for image uploads', () => {
    const { result } = renderHook(() =>
      useImageUpload('/api/upload/image')
    )

    const textFile = new File(['content'], 'test.txt', { type: 'text/plain' })

    act(async () => {
      result.current.upload(textFile)
    })

    expect(result.current.error).toContain('tipo de arquivo não é permitido')
  })

  it('should accept valid image types', async () => {
    const { result } = renderHook(() =>
      useImageUpload('/api/upload/image')
    )

    const imageFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' })

    // Should not fail validation
    await act(async () => {
      await result.current.upload(imageFile)
    })

    // Error should not be about file type
    expect(result.current.error).not.toContain('tipo de arquivo não é permitido')
  })
})

describe('usePDFUpload', () => {
  it('should configure for PDF uploads', () => {
    const { result } = renderHook(() =>
      usePDFUpload('/api/upload/pdf')
    )

    const textFile = new File(['content'], 'test.txt', { type: 'text/plain' })

    act(async () => {
      result.current.upload(textFile)
    })

    expect(result.current.error).toContain('tipo de arquivo não é permitido')
  })

  it('should accept PDF files', async () => {
    const { result } = renderHook(() =>
      usePDFUpload('/api/upload/pdf')
    )

    const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })

    // Should not fail validation
    await act(async () => {
      await result.current.upload(pdfFile)
    })

    // Error should not be about file type
    expect(result.current.error).not.toContain('tipo de arquivo não é permitido')
  })
})
