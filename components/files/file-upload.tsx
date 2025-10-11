"use client";

import React, { useRef, useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { validateFile } from '@/lib/file-validation';
import {
    ALL_SUPPORTED_TYPES,
    MAX_FILE_SIZE_MB,
    formatFileSize,
    getFileTypeLabel
} from '@/types/user-files';

interface FileUploadProps {
    onUploadSuccess?: (file: any) => void;
    onUploadError?: (error: string) => void;
    className?: string;
}

interface UploadingFile {
    file: File;
    progress: number;
    status: 'uploading' | 'completed' | 'failed';
    error?: string;
}

export function FileUpload({ onUploadSuccess, onUploadError, className }: FileUploadProps) {
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const uploadFile = async (file: File, index: number) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Get auth token from Supabase
            const { supabase } = await import('@/lib/supabase');
            let { data: { session }, error: sessionError } = await supabase.auth.getSession();

            console.log('Session check in upload:', {
                hasSession: !!session,
                hasToken: !!session?.access_token,
                sessionError: sessionError?.message,
                user: session?.user?.id
            });

            if (!session?.access_token) {
                console.log('No session, trying to refresh...');
                // Try to refresh session
                const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

                console.log('Refresh result:', {
                    hasRefreshData: !!refreshData.session,
                    refreshError: refreshError?.message
                });

                if (refreshError || !refreshData.session?.access_token) {
                    throw new Error('Você precisa estar logado para fazer upload de arquivos');
                }

                // Use refreshed session
                session = refreshData.session;
            }

            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
                setUploadingFiles(prev =>
                    prev.map((item, i) =>
                        i === index && item.progress < 90
                            ? { ...item, progress: item.progress + 10 }
                            : item
                    )
                );
            }, 200);

            const response = await fetch('/api/files/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: formData,
            });

            clearInterval(progressInterval);

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP ${response.status}`);
            }

            // Mark as completed
            setUploadingFiles(prev =>
                prev.map((item, i) =>
                    i === index
                        ? { ...item, status: 'completed', progress: 100 }
                        : item
                )
            );

            if (onUploadSuccess) {
                onUploadSuccess(result.file);
            }

            // Remove completed file after 2 seconds
            setTimeout(() => {
                setUploadingFiles(prev => prev.filter((_, i) => i !== index));
            }, 2000);

        } catch (error) {
            // Mark as failed
            const errorMessage = error instanceof Error ? error.message : 'Upload failed';

            setUploadingFiles(prev =>
                prev.map((item, i) =>
                    i === index
                        ? { ...item, status: 'failed', error: errorMessage }
                        : item
                )
            );

            if (onUploadError) {
                onUploadError(errorMessage);
            }
        }
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        setIsUploading(true);

        for (const file of Array.from(files)) {
            // Validate file before upload
            const validation = validateFile(file);
            if (!validation.valid) {
                if (onUploadError) {
                    onUploadError(validation.error!);
                }
                continue;
            }

            // Add file to uploading list
            const uploadingFile: UploadingFile = {
                file,
                progress: 0,
                status: 'uploading'
            };

            const currentIndex = uploadingFiles.length;
            setUploadingFiles(prev => [...prev, uploadingFile]);

            // Start upload
            await uploadFile(file, currentIndex);
        }

        setIsUploading(false);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const removeUploadingFile = (index: number) => {
        setUploadingFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className={className}>
            {/* Upload Area */}
            <Card>
                <CardContent className="p-6">
                    <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />

                        <div className="mb-4">
                            <p className="text-lg font-medium text-gray-900 mb-2">
                                Enviar Arquivos
                            </p>
                            <p className="text-sm text-gray-500 mb-2">
                                Tipos suportados: JPG, PNG, GIF, WebP, PDF, DOC, DOCX, XLS, XLSX
                            </p>
                            <p className="text-xs text-gray-400">
                                Tamanho máximo: {MAX_FILE_SIZE_MB}MB por arquivo
                            </p>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept={ALL_SUPPORTED_TYPES.join(',')}
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        <Button
                            onClick={handleUploadClick}
                            disabled={isUploading}
                            className="w-full sm:w-auto"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Selecionar Arquivos
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Upload Progress */}
            {uploadingFiles.length > 0 && (
                <div className="mt-4 space-y-3">
                    {uploadingFiles.map((item, index) => (
                        <Card key={index}>
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-3">
                                    <File className="h-8 w-8 text-gray-400 flex-shrink-0" />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {item.file.name}
                                            </p>

                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs text-gray-500">
                                                    {formatFileSize(item.file.size)} • {getFileTypeLabel(item.file.type)}
                                                </span>

                                                {item.status === 'completed' && (
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                )}

                                                {item.status === 'failed' && (
                                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                                )}

                                                {item.status !== 'uploading' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeUploadingFile(index)}
                                                        className="h-6 w-6 p-0"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {item.status === 'uploading' && (
                                            <div className="space-y-1">
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-primary h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${item.progress}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    {item.progress}% enviado
                                                </p>
                                            </div>
                                        )}

                                        {item.status === 'completed' && (
                                            <p className="text-xs text-green-600">
                                                Upload concluído com sucesso
                                            </p>
                                        )}

                                        {item.status === 'failed' && (
                                            <p className="text-xs text-red-600">
                                                {item.error || 'Falha no upload'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}