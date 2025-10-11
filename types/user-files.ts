import { Database } from './database';

// Type aliases for better readability
export type UserFile = Database['public']['Tables']['user_files']['Row'];
export type UserFileInsert = Database['public']['Tables']['user_files']['Insert'];
export type UserFileUpdate = Database['public']['Tables']['user_files']['Update'];
export type UploadStatus = Database['public']['Enums']['upload_status'];

// API Request/Response types
export interface FileUploadRequest {
  file: File;
}

export interface FileUploadResponse {
  success: boolean;
  file?: UserFile;
  error?: string;
}

export interface FileListResponse {
  files: UserFile[];
  total: number;
  page: number;
  limit: number;
}

export interface FileDeleteResponse {
  success: boolean;
  error?: string;
}

export interface FileDownloadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

// File validation types
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface FileValidationOptions {
  maxSize?: number;
  allowedTypes?: string[];
  fileType?: 'image' | 'pdf' | 'document';
}

// File display types
export interface FileDisplayInfo {
  id: string;
  name: string;
  size: string; // Formatted size (e.g., "2.5 MB")
  type: string;
  uploadDate: string; // Formatted date
  isImage: boolean;
  isPdf: boolean;
  thumbnailUrl?: string;
}

// File upload progress types
export interface FileUploadProgress {
  fileId: string;
  fileName: string;
  progress: number; // 0-100
  status: 'uploading' | 'completed' | 'failed';
  error?: string;
}

// Supported file types
export const SUPPORTED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
} as const;

export const ALL_SUPPORTED_TYPES = [
  ...SUPPORTED_FILE_TYPES.images,
  ...SUPPORTED_FILE_TYPES.documents
] as const;

// File size constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILE_SIZE_MB = 10;

// File type helpers
export function isImageFile(mimeType: string): boolean {
  return SUPPORTED_FILE_TYPES.images.includes(mimeType as any);
}

export function isPdfFile(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}

export function isDocumentFile(mimeType: string): boolean {
  return SUPPORTED_FILE_TYPES.documents.includes(mimeType as any);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

export function getFileTypeLabel(mimeType: string): string {
  const typeMap: Record<string, string> = {
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'image/webp': 'WebP',
    'application/pdf': 'PDF',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.ms-excel': 'XLS',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX'
  };
  
  return typeMap[mimeType] || 'Arquivo';
}