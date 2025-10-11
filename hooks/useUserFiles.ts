"use client";

import { useState, useEffect, useCallback } from 'react';
import { UserFile, FileListResponse } from '@/types/user-files';

interface UseUserFilesOptions {
  initialPage?: number;
  initialLimit?: number;
  initialSearch?: string;
  autoLoad?: boolean;
}

interface UseUserFilesReturn {
  files: UserFile[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  totalFiles: number;
  currentPage: number;
  totalPages: number;
  searchTerm: string;
  
  // Actions
  loadFiles: (page?: number, search?: string, showLoading?: boolean) => Promise<void>;
  refreshFiles: () => Promise<void>;
  setSearchTerm: (search: string) => void;
  setPage: (page: number) => void;
  addFile: (file: UserFile) => void;
  removeFile: (fileId: string) => void;
  updateFile: (fileId: string, updates: Partial<UserFile>) => void;
  clearError: () => void;
}

export function useUserFiles(options: UseUserFilesOptions = {}): UseUserFilesReturn {
  const {
    initialPage = 1,
    initialLimit = 20,
    initialSearch = '',
    autoLoad = true
  } = options;

  // State
  const [files, setFiles] = useState<UserFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalFiles, setTotalFiles] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  
  const limit = initialLimit;
  const totalPages = Math.ceil(totalFiles / limit);

  // Load files function
  const loadFiles = useCallback(async (
    page = currentPage,
    search = searchTerm,
    showLoading = true
  ) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search.trim()) {
        params.append('search', search.trim());
      }

      const response = await fetch(`/api/files?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: FileListResponse | { error: string } = await response.json();

      if ('error' in data) {
        throw new Error(data.error);
      }

      setFiles(data.files);
      setTotalFiles(data.total);
      setCurrentPage(page);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar arquivos';
      setError(errorMessage);
      console.error('Error loading files:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentPage, searchTerm, limit]);

  // Refresh files (reload current page)
  const refreshFiles = useCallback(async () => {
    await loadFiles(currentPage, searchTerm, false);
  }, [loadFiles, currentPage, searchTerm]);

  // Set search term with debounce effect handled by parent
  const handleSetSearchTerm = useCallback((search: string) => {
    setSearchTerm(search);
  }, []);

  // Set page
  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
    loadFiles(page, searchTerm);
  }, [loadFiles, searchTerm]);

  // Add file to the beginning of the list
  const addFile = useCallback((file: UserFile) => {
    setFiles(prev => [file, ...prev]);
    setTotalFiles(prev => prev + 1);
  }, []);

  // Remove file from list
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setTotalFiles(prev => Math.max(0, prev - 1));
  }, []);

  // Update file in list
  const updateFile = useCallback((fileId: string, updates: Partial<UserFile>) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, ...updates } : file
    ));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadFiles(initialPage, initialSearch);
    }
  }, []); // Only run on mount

  // Load files when search term changes (with debounce handled by parent)
  useEffect(() => {
    if (searchTerm !== initialSearch) {
      loadFiles(1, searchTerm);
    }
  }, [searchTerm]); // Only when searchTerm changes

  return {
    files,
    isLoading,
    isRefreshing,
    error,
    totalFiles,
    currentPage,
    totalPages,
    searchTerm,
    
    // Actions
    loadFiles,
    refreshFiles,
    setSearchTerm: handleSetSearchTerm,
    setPage,
    addFile,
    removeFile,
    updateFile,
    clearError,
  };
}