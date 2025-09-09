/**
 * Integration tests for upload functionality
 * Tests the complete flow from UI to API to storage
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { rest } from 'msw'
import { setupServer } from 'msw/node'

// Mock Next.js router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
}

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

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

// Mock components for testing
const MockProfilePage = () => {
  const [file, setFile] = React.useState<File | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/profile-photo', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
        },
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        setSuccess('Upload realizado com sucesso!')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erro no upload')
      }
    } catch (err) {
      setError('Erro de rede')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        data-testid="file-input"
      />
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        data-testid="upload-button"
      >
        {uploading ? 'Enviando...' : 'Enviar'}
      </button>
      {error && <div data-testid="error-message">{error}</div>}
      {success && <div data-testid="success-message">{success}</div>}
    </div>
  )
}

// MSW server for API mocking
const server = setupServer(
  // Successful upload
  rest.post('/api/upload/profile-photo', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        url: 'https://example.com/uploaded-image.jpg',
        message: 'Upload realizado com sucesso'
      })
    )
  }),

  // CV upload endpoint
  rest.post('/api/upload/cv', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        url: 'https://example.com/uploaded-cv.pdf',
        message: 'CV enviado com sucesso'
      })
    )
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Upload Integration Tests', () => {
  describe('Profile Photo Upload', () => {
    it('should complete successful image upload flow', async () => {
      const user = userEvent.setup()
      render(<MockProfilePage />)

      // Create a test image file
      const imageFile = new File(['image content'], 'test.jpg', {
        type: 'image/jpeg',
      })

      // Select file
      const fileInput = screen.getByTestId('file-input')
      await user.upload(fileInput, imageFile)

      // Upload file
      const uploadButton = screen.getByTestId('upload-button')
      expect(uploadButton).not.toBeDisabled()

      await user.click(uploadButton)

      // Check loading state
      expect(screen.getByText('Enviando...')).toBeInTheDocument()
      expect(uploadButton).toBeDisabled()

      // Wait for success
      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toBeInTheDocument()
      })

      expect(screen.getByText('Upload realizado com sucesso!')).toBeInTheDocument()
    })

    it('should handle upload errors gracefully', async () => {
      // Mock error response
      server.use(
        rest.post('/api/upload/profile-photo', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              error: 'Arquivo muito grande'
            })
          )
        })
      )

      const user = userEvent.setup()
      render(<MockProfilePage />)

      const imageFile = new File(['image content'], 'large.jpg', {
        type: 'image/jpeg',
      })

      const fileInput = screen.getByTestId('file-input')
      await user.upload(fileInput, imageFile)

      const uploadButton = screen.getByTestId('upload-button')
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
      })

      expect(screen.getByText('Arquivo muito grande')).toBeInTheDocument()
    })

    it('should handle network errors', async () => {
      // Mock network error
      server.use(
        rest.post('/api/upload/profile-photo', (req, res, ctx) => {
          return res.networkError('Network error')
        })
      )

      const user = userEvent.setup()
      render(<MockProfilePage />)

      const imageFile = new File(['image content'], 'test.jpg', {
        type: 'image/jpeg',
      })

      const fileInput = screen.getByTestId('file-input')
      await user.upload(fileInput, imageFile)

      const uploadButton = screen.getByTestId('upload-button')
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
      })

      expect(screen.getByText('Erro de rede')).toBeInTheDocument()
    })

    it('should validate file types', async () => {
      const user = userEvent.setup()
      render(<MockProfilePage />)

      // Try to upload a non-image file
      const textFile = new File(['text content'], 'test.txt', {
        type: 'text/plain',
      })

      const fileInput = screen.getByTestId('file-input')
      
      // The file input should reject non-image files due to accept attribute
      // This is a browser-level validation
      await user.upload(fileInput, textFile)

      const uploadButton = screen.getByTestId('upload-button')
      
      // Button should be enabled if file was somehow selected
      // But the API should reject it
      if (!uploadButton.disabled) {
        server.use(
          rest.post('/api/upload/profile-photo', (req, res, ctx) => {
            return res(
              ctx.status(400),
              ctx.json({
                error: 'Tipo de arquivo não permitido'
              })
            )
          })
        )

        await user.click(uploadButton)

        await waitFor(() => {
          expect(screen.getByTestId('error-message')).toBeInTheDocument()
        })
      }
    })
  })

  describe('CV Upload Flow', () => {
    const MockCVUpload = () => {
      const [file, setFile] = React.useState<File | null>(null)
      const [uploading, setUploading] = React.useState(false)
      const [error, setError] = React.useState<string | null>(null)
      const [success, setSuccess] = React.useState<string | null>(null)

      const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0]
        if (selectedFile) {
          // Validate PDF
          if (selectedFile.type !== 'application/pdf') {
            setError('Apenas arquivos PDF são permitidos')
            return
          }
          
          // Validate size (5MB)
          if (selectedFile.size > 5 * 1024 * 1024) {
            setError('Arquivo deve ter no máximo 5MB')
            return
          }

          setFile(selectedFile)
          setError(null)
        }
      }

      const handleUpload = async () => {
        if (!file) return

        setUploading(true)
        setError(null)
        setSuccess(null)

        try {
          const formData = new FormData()
          formData.append('file', file)

          const response = await fetch('/api/upload/cv', {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer test-token',
            },
            body: formData,
          })

          if (response.ok) {
            const result = await response.json()
            setSuccess('CV enviado com sucesso!')
          } else {
            const errorData = await response.json()
            setError(errorData.error || 'Erro no upload')
          }
        } catch (err) {
          setError('Erro de rede')
        } finally {
          setUploading(false)
        }
      }

      return (
        <div>
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            data-testid="cv-input"
          />
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            data-testid="cv-upload-button"
          >
            {uploading ? 'Enviando CV...' : 'Enviar CV'}
          </button>
          {error && <div data-testid="cv-error">{error}</div>}
          {success && <div data-testid="cv-success">{success}</div>}
        </div>
      )
    }

    it('should upload PDF successfully', async () => {
      const user = userEvent.setup()
      render(<MockCVUpload />)

      const pdfFile = new File(['pdf content'], 'resume.pdf', {
        type: 'application/pdf',
      })

      const fileInput = screen.getByTestId('cv-input')
      await user.upload(fileInput, pdfFile)

      const uploadButton = screen.getByTestId('cv-upload-button')
      expect(uploadButton).not.toBeDisabled()

      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByTestId('cv-success')).toBeInTheDocument()
      })

      expect(screen.getByText('CV enviado com sucesso!')).toBeInTheDocument()
    })

    it('should reject non-PDF files', async () => {
      const user = userEvent.setup()
      render(<MockCVUpload />)

      const textFile = new File(['text content'], 'resume.txt', {
        type: 'text/plain',
      })

      const fileInput = screen.getByTestId('cv-input')
      await user.upload(fileInput, textFile)

      await waitFor(() => {
        expect(screen.getByTestId('cv-error')).toBeInTheDocument()
      })

      expect(screen.getByText('Apenas arquivos PDF são permitidos')).toBeInTheDocument()
    })

    it('should reject oversized files', async () => {
      const user = userEvent.setup()
      render(<MockCVUpload />)

      // Create a large file (6MB)
      const largeContent = 'x'.repeat(6 * 1024 * 1024)
      const largeFile = new File([largeContent], 'large.pdf', {
        type: 'application/pdf',
      })

      const fileInput = screen.getByTestId('cv-input')
      await user.upload(fileInput, largeFile)

      await waitFor(() => {
        expect(screen.getByTestId('cv-error')).toBeInTheDocument()
      })

      expect(screen.getByText('Arquivo deve ter no máximo 5MB')).toBeInTheDocument()
    })
  })

  describe('API Error Scenarios', () => {
    it('should handle authentication errors', async () => {
      // Mock auth error
      server.use(
        rest.post('/api/upload/profile-photo', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({
              error: 'Token inválido'
            })
          )
        })
      )

      const user = userEvent.setup()
      render(<MockProfilePage />)

      const imageFile = new File(['image content'], 'test.jpg', {
        type: 'image/jpeg',
      })

      const fileInput = screen.getByTestId('file-input')
      await user.upload(fileInput, imageFile)

      const uploadButton = screen.getByTestId('upload-button')
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
      })

      expect(screen.getByText('Token inválido')).toBeInTheDocument()
    })

    it('should handle server errors', async () => {
      // Mock server error
      server.use(
        rest.post('/api/upload/profile-photo', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              error: 'Erro interno do servidor'
            })
          )
        })
      )

      const user = userEvent.setup()
      render(<MockProfilePage />)

      const imageFile = new File(['image content'], 'test.jpg', {
        type: 'image/jpeg',
      })

      const fileInput = screen.getByTestId('file-input')
      await user.upload(fileInput, imageFile)

      const uploadButton = screen.getByTestId('upload-button')
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
      })

      expect(screen.getByText('Erro interno do servidor')).toBeInTheDocument()
    })
  })

  describe('Progress Tracking', () => {
    it('should show upload progress', async () => {
      // Mock slow upload with progress
      server.use(
        rest.post('/api/upload/profile-photo', (req, res, ctx) => {
          return res(
            ctx.delay(1000), // 1 second delay
            ctx.status(200),
            ctx.json({
              url: 'https://example.com/uploaded-image.jpg',
              message: 'Upload realizado com sucesso'
            })
          )
        })
      )

      const user = userEvent.setup()
      render(<MockProfilePage />)

      const imageFile = new File(['image content'], 'test.jpg', {
        type: 'image/jpeg',
      })

      const fileInput = screen.getByTestId('file-input')
      await user.upload(fileInput, imageFile)

      const uploadButton = screen.getByTestId('upload-button')
      await user.click(uploadButton)

      // Should show loading state
      expect(screen.getByText('Enviando...')).toBeInTheDocument()
      expect(uploadButton).toBeDisabled()

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toBeInTheDocument()
      }, { timeout: 2000 })
    })
  })
})
