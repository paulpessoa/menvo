/**
 * Centralized error handling service for user-friendly error messages and logging
 */

export interface ErrorDetails {
  code?: string;
  field?: string;
  details?: Record<string, any>;
}

export interface AppError {
  message: string;
  code?: string;
  originalError?: any;
  details?: ErrorDetails;
}

// User-friendly error messages mapping
export const ERROR_MESSAGES = {
  // File upload errors
  FILE_TOO_LARGE: 'Arquivo muito grande. Máximo permitido: 5MB',
  INVALID_FILE_TYPE_IMAGE: 'Tipo de arquivo não suportado. Use JPG, PNG, WebP ou GIF',
  INVALID_FILE_TYPE_PDF: 'Apenas arquivos PDF são aceitos',
  UPLOAD_FAILED: 'Falha no upload. Tente novamente',
  
  // Network errors
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet e tente novamente',
  TIMEOUT_ERROR: 'Operação demorou muito. Tente novamente',
  
  // Authentication errors
  UNAUTHORIZED: 'Sessão expirada. Faça login novamente',
  FORBIDDEN: 'Você não tem permissão para esta ação',
  
  // Profile errors
  PROFILE_UPDATE_FAILED: 'Erro ao salvar perfil. Tente novamente',
  REQUIRED_FIELDS_MISSING: 'Preencha todos os campos obrigatórios',
  INVALID_EMAIL: 'Email inválido',
  SLUG_ALREADY_EXISTS: 'Este slug já está em uso. Escolha outro',
  
  // Storage errors
  STORAGE_ERROR: 'Erro no armazenamento. Tente novamente',
  FILE_NOT_FOUND: 'Arquivo não encontrado',
  
  // Generic errors
  UNKNOWN_ERROR: 'Erro inesperado. Tente novamente ou contate o suporte',
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos destacados',
} as const;

export type ErrorCode = keyof typeof ERROR_MESSAGES;

/**
 * Maps various error types to user-friendly messages
 */
export function mapErrorToUserMessage(error: any): string {
  // Handle string errors
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error as ErrorCode] || error;
  }

  // Handle Error objects
  if (error instanceof Error) {
    // Check if it's a known error code
    if (error.message in ERROR_MESSAGES) {
      return ERROR_MESSAGES[error.message as ErrorCode];
    }
    
    // Handle specific error patterns
    if (error.message.includes('File too large')) {
      return ERROR_MESSAGES.FILE_TOO_LARGE;
    }
    
    if (error.message.includes('Invalid file type')) {
      return ERROR_MESSAGES.INVALID_FILE_TYPE_IMAGE;
    }
    
    if (error.message.includes('Network')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    
    if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      return ERROR_MESSAGES.UNAUTHORIZED;
    }
    
    if (error.message.includes('Forbidden') || error.message.includes('403')) {
      return ERROR_MESSAGES.FORBIDDEN;
    }
    
    return error.message;
  }

  // Handle API error responses
  if (error?.error) {
    return mapErrorToUserMessage(error.error);
  }

  // Handle Supabase errors
  if (error?.message) {
    return mapErrorToUserMessage(error.message);
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Logs errors for debugging with structured information
 */
export function logError(error: any, context?: string, additionalData?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context: context || 'Unknown',
    error: {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      code: error?.code,
      name: error?.name,
    },
    additionalData,
  };

  console.error('🚨 Error logged:', errorInfo);
  
  // In production, you might want to send this to an error tracking service
  // like Sentry, LogRocket, etc.
}

/**
 * Creates a standardized error object
 */
export function createAppError(
  message: string,
  code?: string,
  originalError?: any,
  details?: ErrorDetails
): AppError {
  return {
    message: mapErrorToUserMessage(message),
    code,
    originalError,
    details,
  };
}

/**
 * Handles async operations with proper error logging and user feedback
 */
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  context: string,
  onError?: (error: AppError) => void
): Promise<{ success: boolean; data?: T; error?: AppError }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const appError = createAppError(
      error?.message || ERROR_MESSAGES.UNKNOWN_ERROR,
      error?.code,
      error
    );
    
    logError(error, context);
    
    if (onError) {
      onError(appError);
    }
    
    return { success: false, error: appError };
  }
}

/**
 * Validates file type and size
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    fileType?: 'image' | 'pdf';
  }
): { valid: boolean; error?: string } {
  const { maxSize = 5 * 1024 * 1024, allowedTypes, fileType } = options;

  // Check file size
  if (file.size > maxSize) {
    return { valid: false, error: ERROR_MESSAGES.FILE_TOO_LARGE };
  }

  // Check file type
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    const errorKey = fileType === 'pdf' 
      ? 'INVALID_FILE_TYPE_PDF' 
      : 'INVALID_FILE_TYPE_IMAGE';
    return { valid: false, error: ERROR_MESSAGES[errorKey] };
  }

  return { valid: true };
}