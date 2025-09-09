import {
  validateFile,
  validateFiles,
  getFileExtension,
  formatFileSize,
  validateProfileImage,
  validateCV,
  FILE_TYPE_CONFIGS,
} from '@/lib/file-validation'

describe('File Validation Utilities', () => {
  describe('validateFile', () => {
    it('should validate allowed file types', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      const options = { allowedTypes: ['image/jpeg', 'image/png'] }

      const result = validateFile(file, options)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject disallowed file types', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      const options = { allowedTypes: ['image/jpeg', 'image/png'] }

      const result = validateFile(file, options)

      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('Tipo de arquivo não suportado')
    })

    it('should validate file size within limit', () => {
      const content = 'x'.repeat(1000) // 1KB
      const file = new File([content], 'test.txt', { type: 'text/plain' })
      const options = { maxSize: 2048 } // 2KB

      const result = validateFile(file, options)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject file size exceeding limit', () => {
      const content = 'x'.repeat(2048) // 2KB
      const file = new File([content], 'test.txt', { type: 'text/plain' })
      const options = { maxSize: 1024 } // 1KB

      const result = validateFile(file, options)

      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('muito grande')
    })
  })

  describe('validateProfileImage', () => {
    it('should validate valid image file', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })

      const result = validateProfileImage(file)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject non-image file', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })

      const result = validateProfileImage(file)

      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('Tipo de arquivo não suportado')
    })

    it('should reject oversized image', () => {
      const content = 'x'.repeat(6 * 1024 * 1024) // 6MB
      const file = new File([content], 'test.jpg', { type: 'image/jpeg' })

      const result = validateProfileImage(file)

      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('muito grande')
    })
  })

  describe('validateCV', () => {
    it('should validate valid PDF file', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })

      const result = validateCV(file)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject non-PDF file', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })

      const result = validateCV(file)

      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('Tipo de arquivo não suportado')
    })

    it('should reject oversized PDF', () => {
      const content = 'x'.repeat(6 * 1024 * 1024) // 6MB
      const file = new File([content], 'test.pdf', { type: 'application/pdf' })

      const result = validateCV(file)

      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('muito grande')
    })
  })

  describe('getFileExtension', () => {
    it('should extract file extension', () => {
      expect(getFileExtension('test.jpg')).toBe('.jpg')
      expect(getFileExtension('document.pdf')).toBe('.pdf')
      expect(getFileExtension('file.name.with.dots.txt')).toBe('.txt')
    })

    it('should handle files without extension', () => {
      expect(getFileExtension('filename')).toBeNull()
      expect(getFileExtension('')).toBeNull()
    })

    it('should handle hidden files', () => {
      expect(getFileExtension('.gitignore')).toBeNull()
      expect(getFileExtension('.env.local')).toBe('.local')
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(512)).toBe('512 Bytes')
      expect(formatFileSize(1023)).toBe('1023 Bytes')
    })

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
      expect(formatFileSize(2048)).toBe('2 KB')
    })

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB')
      expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB')
    })

    it('should format gigabytes correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
      expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB')
    })
  })

  describe('FILE_TYPE_CONFIGS', () => {
    it('should have image configuration', () => {
      expect(FILE_TYPE_CONFIGS.image.allowedTypes).toContain('image/jpeg')
      expect(FILE_TYPE_CONFIGS.image.allowedTypes).toContain('image/png')
      expect(FILE_TYPE_CONFIGS.image.maxSize).toBe(5 * 1024 * 1024)
    })

    it('should have PDF configuration', () => {
      expect(FILE_TYPE_CONFIGS.pdf.allowedTypes).toContain('application/pdf')
      expect(FILE_TYPE_CONFIGS.pdf.maxSize).toBe(5 * 1024 * 1024)
    })

    it('should have document configuration', () => {
      expect(FILE_TYPE_CONFIGS.document.allowedTypes).toContain('application/pdf')
      expect(FILE_TYPE_CONFIGS.document.allowedTypes).toContain('text/plain')
      expect(FILE_TYPE_CONFIGS.document.maxSize).toBe(10 * 1024 * 1024)
    })
  })
})
