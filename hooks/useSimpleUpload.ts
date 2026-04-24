import { useState, useCallback } from 'react'

interface SimpleUploadResult {
  success: boolean
  data?: any
  error?: string
}

interface UseSimpleUploadReturn {
  upload: (file: File) => Promise<SimpleUploadResult>
  isUploading: boolean
  progress: number
  error: string | null
}

export function useSimpleUpload(endpoint: string): UseSimpleUploadReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(async (file: File): Promise<SimpleUploadResult> => {
    setIsUploading(true)
    setProgress(0)
    setError(null)

    try {
      console.log('🚀 Starting simple upload:', { file: file.name, size: file.size })

      // Get Supabase session
      const { createClient } = await import('@/lib/utils/supabase/client')
      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        throw new Error('Não foi possível obter a sessão. Faça login novamente.')
      }

      console.log('✅ Session obtained successfully')

      // Prepare form data
      const formData = new FormData()
      formData.append('file', file)

      console.log('📤 Sending upload request to:', endpoint)

      // Make upload request
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      })

      console.log('📥 Upload response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Upload successful:', result)

      setProgress(100)
      return { success: true, data: result }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      console.error('❌ Upload error:', errorMessage)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsUploading(false)
    }
  }, [endpoint])

  return {
    upload,
    isUploading,
    progress,
    error,
  }
}

// Convenience hooks
export function useSimpleImageUpload(endpoint: string) {
  return useSimpleUpload(endpoint)
}

export function useSimplePDFUpload(endpoint: string) {
  return useSimpleUpload(endpoint)
}
