/**
 * File validation utilities with comprehensive checks
 */

export interface FileValidationOptions {
  maxSize?: number;
  minSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
  requireExtension?: boolean;
}

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Common file type configurations
export const FILE_TYPE_CONFIGS = {
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  },
  pdf: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['application/pdf'],
    allowedExtensions: ['.pdf'],
  },
  document: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx', '.txt'],
  },
} as const;

/**
 * Validates a file against specified criteria
 */
export function validateFile(file: File, options: FileValidationOptions = {}): FileValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    minSize = 0,
    allowedTypes = [],
    allowedExtensions = [],
    requireExtension = true,
  } = options;

  // Check if file exists
  if (!file) {
    errors.push('Nenhum arquivo selecionado');
    return { valid: false, errors, warnings };
  }

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    errors.push(`Arquivo muito grande. Máximo permitido: ${maxSizeMB}MB`);
  }

  if (file.size < minSize) {
    const minSizeMB = (minSize / (1024 * 1024)).toFixed(1);
    errors.push(`Arquivo muito pequeno. Mínimo necessário: ${minSizeMB}MB`);
  }

  // Check MIME type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    const typeNames = getFileTypeNames(allowedTypes);
    errors.push(`Tipo de arquivo não suportado. Tipos aceitos: ${typeNames}`);
  }

  // Check file extension
  const fileExtension = getFileExtension(file.name);
  if (requireExtension && !fileExtension) {
    errors.push('Arquivo deve ter uma extensão válida');
  }

  if (allowedExtensions.length > 0 && fileExtension && !allowedExtensions.includes(fileExtension)) {
    errors.push(`Extensão não suportada. Extensões aceitas: ${allowedExtensions.join(', ')}`);
  }

  // Additional checks for specific file types
  if (file.type.startsWith('image/')) {
    validateImageFile(file, warnings);
  }

  // Check for potentially dangerous files
  if (isDangerousFile(file)) {
    errors.push('Tipo de arquivo não permitido por motivos de segurança');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates multiple files
 */
export function validateFiles(files: File[], options: FileValidationOptions = {}): FileValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  files.forEach((file, index) => {
    const result = validateFile(file, options);
    
    if (!result.valid) {
      result.errors.forEach(error => {
        allErrors.push(`Arquivo ${index + 1}: ${error}`);
      });
    }
    
    result.warnings.forEach(warning => {
      allWarnings.push(`Arquivo ${index + 1}: ${warning}`);
    });
  });

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * Gets file extension from filename
 */
export function getFileExtension(filename: string): string | null {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
    return null;
  }
  return filename.substring(lastDotIndex).toLowerCase();
}

/**
 * Gets human-readable file type names
 */
function getFileTypeNames(mimeTypes: string[]): string {
  const typeMap: Record<string, string> = {
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/webp': 'WebP',
    'image/gif': 'GIF',
    'application/pdf': 'PDF',
    'application/msword': 'Word (DOC)',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word (DOCX)',
    'text/plain': 'Texto',
  };

  return mimeTypes
    .map(type => typeMap[type] || type)
    .join(', ');
}

/**
 * Additional validation for image files
 */
function validateImageFile(file: File, warnings: string[]): void {
  // Check for very large images that might cause performance issues
  if (file.size > 2 * 1024 * 1024) { // 2MB
    warnings.push('Imagem grande pode demorar para carregar. Considere reduzir o tamanho.');
  }

  // Check for unusual image formats
  if (file.type === 'image/gif' && file.size > 1024 * 1024) { // 1MB
    warnings.push('GIFs grandes podem afetar a performance da página.');
  }
}

/**
 * Checks if file is potentially dangerous
 */
function isDangerousFile(file: File): boolean {
  const dangerousExtensions = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
    '.app', '.deb', '.pkg', '.dmg', '.rpm', '.msi', '.run', '.bin'
  ];

  const extension = getFileExtension(file.name);
  if (extension && dangerousExtensions.includes(extension)) {
    return true;
  }

  // Check for executable MIME types
  const dangerousMimeTypes = [
    'application/x-executable',
    'application/x-msdownload',
    'application/x-msdos-program',
    'application/javascript',
  ];

  return dangerousMimeTypes.includes(file.type);
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Checks if browser supports file type
 */
export function isFileTypeSupported(mimeType: string): boolean {
  // Create a temporary input element to test support
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = mimeType;
  
  // If the browser supports the type, it will be in the accept attribute
  return input.accept.includes(mimeType);
}

/**
 * Reads file as data URL for preview
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Validates and prepares file for upload
 */
export async function prepareFileForUpload(
  file: File,
  options: FileValidationOptions = {}
): Promise<{ valid: boolean; file?: File; errors?: string[] }> {
  const validation = validateFile(file, options);
  
  if (!validation.valid) {
    return { valid: false, errors: validation.errors };
  }

  // For images, we could add compression here in the future
  // For now, just return the original file
  return { valid: true, file };
}

// Predefined validation functions for common use cases
export const validateProfileImage = (file: File) => 
  validateFile(file, FILE_TYPE_CONFIGS.image);

export const validateCV = (file: File) => 
  validateFile(file, FILE_TYPE_CONFIGS.pdf);

export const validateDocument = (file: File) => 
  validateFile(file, FILE_TYPE_CONFIGS.document);
