import { NextResponse } from 'next/server'

export class ErrorHandler {
  static handleApiError(
    error: Error,
    code: string,
    status: number,
    message?: string
  ) {
    return NextResponse.json(
      {
        error: message || error.message,
        code,
      },
      { status }
    )
  }
}

// File validation helper
export function validateFile(file: File, options?: {
  maxSize?: number
  allowedTypes?: string[]
}): { valid: boolean; error?: string } {
  const maxSize = options?.maxSize || 5 * 1024 * 1024 // 5MB default
  const allowedTypes = options?.allowedTypes || ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: ${maxSize / 1024 / 1024}MB`
    }
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`
    }
  }

  return { valid: true }
}

// Async operation handler
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<{ data?: T; error?: string }> {
  try {
    const data = await operation()
    return { data }
  } catch (error) {
    console.error(errorMessage || 'Async operation failed:', error)
    return {
      error: errorMessage || (error instanceof Error ? error.message : 'Operação falhou')
    }
  }
}

// Error logging helper
export function logError(error: Error | unknown, context?: string) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined
  
  console.error(`[Error${context ? ` - ${context}` : ''}]:`, errorMessage)
  if (errorStack) {
    console.error('Stack:', errorStack)
  }
}
