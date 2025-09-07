"use client"

import { useState, useCallback, useRef } from 'react';
import { validateFile, handleAsyncOperation, logError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';

export interface FileUploadOptions {
  endpoint: string;
  maxSize?: number;
  allowedTypes?: string[];
  fileType?: 'image' | 'pdf';
  onProgress?: (progress: number) => void;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

export interface UploadResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface UseFileUploadReturn {
  upload: (file: File) => Promise<UploadResult>;
  progress: number;
  isUploading: boolean;
  cancel: () => void;
  error: string | null;
  reset: () => void;
}

export function useFileUpload(options: FileUploadOptions): UseFileUploadReturn {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    endpoint,
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes,
    fileType,
    onProgress,
    onSuccess,
    onError,
  } = options;

  const reset = useCallback(() => {
    setProgress(0);
    setIsUploading(false);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsUploading(false);
    setProgress(0);
    logger.info('File upload cancelled', 'FileUpload');
  }, []);

  const upload = useCallback(async (file: File): Promise<UploadResult> => {
    // Reset previous state
    setError(null);
    setProgress(0);

    // Validate file
    const validation = validateFile(file, {
      maxSize,
      allowedTypes,
      fileType,
    });

    if (!validation.valid) {
      const errorMessage = validation.error!;
      setError(errorMessage);
      if (onError) onError(errorMessage);
      logger.error('File validation failed', 'FileUpload', { 
        fileName: file.name, 
        fileSize: file.size, 
        fileType: file.type,
        error: errorMessage 
      });
      return { success: false, error: errorMessage };
    }

    setIsUploading(true);
    abortControllerRef.current = new AbortController();

    const result = await handleAsyncOperation(
      async () => {
        // Get auth token with refresh attempt
        const { supabase } = await import('@/lib/supabase');
        
        // Try to get current session first
        let { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        logger.info('Checking session', 'FileUpload', { 
          hasSession: !!session,
          hasToken: !!session?.access_token,
          sessionError: sessionError?.message
        });
        
        if (!session?.access_token) {
          logger.info('No valid session, attempting refresh', 'FileUpload');
          
          // Try to refresh the session
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshData.session?.access_token) {
            logger.error('Session refresh failed', 'FileUpload', { 
              refreshError: refreshError?.message 
            });
            throw new Error('Sessão expirada. Faça login novamente.');
          }
          
          logger.info('Session refreshed successfully', 'FileUpload');
          // Use refreshed session
          session = refreshData.session;
        }

        // Prepare form data
        const formData = new FormData();
        formData.append('file', file);

        logger.info('Starting file upload', 'FileUpload', {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          endpoint,
        });

        // Create XMLHttpRequest for progress tracking
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          // Handle progress
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progressPercent = Math.round((event.loaded / event.total) * 100);
              setProgress(progressPercent);
              if (onProgress) onProgress(progressPercent);
            }
          });

          // Handle completion
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch (e) {
                reject(new Error('Invalid response format'));
              }
            } else {
              try {
                const errorResponse = JSON.parse(xhr.responseText);
                reject(new Error(errorResponse.error || `HTTP ${xhr.status}`));
              } catch (e) {
                reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
              }
            }
          });

          // Handle errors
          xhr.addEventListener('error', () => {
            reject(new Error('NETWORK_ERROR'));
          });

          // Handle timeout
          xhr.addEventListener('timeout', () => {
            reject(new Error('TIMEOUT_ERROR'));
          });

          // Handle abort
          xhr.addEventListener('abort', () => {
            reject(new Error('Upload cancelled'));
          });

          // Set up abort controller
          if (abortControllerRef.current) {
            abortControllerRef.current.signal.addEventListener('abort', () => {
              xhr.abort();
            });
          }

          // Configure and send request
          xhr.open('POST', endpoint);
          xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
          xhr.timeout = 30000; // 30 second timeout
          xhr.send(formData);
        });
      },
      'FileUpload'
    );

    setIsUploading(false);
    abortControllerRef.current = null;

    if (result.success) {
      setProgress(100);
      logger.fileUpload(true, file.name, file.size, file.type);
      if (onSuccess) onSuccess(result.data);
      return { success: true, data: result.data };
    } else {
      const errorMessage = result.error?.message || 'Upload failed';
      setError(errorMessage);
      setProgress(0);
      logger.fileUpload(false, file.name, file.size, file.type);
      if (onError) onError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [endpoint, maxSize, allowedTypes, fileType, onProgress, onSuccess, onError]);

  return {
    upload,
    progress,
    isUploading,
    cancel,
    error,
    reset,
  };
}

// Predefined configurations for common file types
export const IMAGE_UPLOAD_CONFIG: Partial<FileUploadOptions> = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  fileType: 'image',
};

export const PDF_UPLOAD_CONFIG: Partial<FileUploadOptions> = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['application/pdf'],
  fileType: 'pdf',
};

// Convenience hooks for specific file types
export function useImageUpload(
  endpoint: string,
  options?: Partial<FileUploadOptions>
): UseFileUploadReturn {
  return useFileUpload({
    ...IMAGE_UPLOAD_CONFIG,
    endpoint,
    ...options,
  });
}

export function usePDFUpload(
  endpoint: string,
  options?: Partial<FileUploadOptions>
): UseFileUploadReturn {
  return useFileUpload({
    ...PDF_UPLOAD_CONFIG,
    endpoint,
    ...options,
  });
}