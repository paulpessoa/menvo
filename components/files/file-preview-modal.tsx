"use client";

import React, { useState, useEffect } from 'react';
import { X, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { UserFile, formatFileSize, getFileTypeLabel, isImageFile, isPdfFile } from '@/types/user-files';

interface FilePreviewModalProps {
    file: UserFile | null;
    isOpen: boolean;
    onClose: () => void;
}

export function FilePreviewModal({ file, isOpen, onClose }: FilePreviewModalProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!file || !isOpen) {
            setPreviewUrl(null);
            setError(null);
            return;
        }

        const loadPreview = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Get signed URL for preview
                const response = await fetch(`/api/files/${file.id}/download?json=true`);
                const data = await response.json();

                if (data.success && data.url) {
                    setPreviewUrl(data.url);
                } else {
                    setError(data.error || 'Erro ao carregar preview');
                }
            } catch (err) {
                console.error('Preview error:', err);
                setError('Erro ao carregar preview');
            } finally {
                setIsLoading(false);
            }
        };

        loadPreview();
    }, [file, isOpen]);

    const handleDownload = async () => {
        if (!file) return;

        try {
            const downloadUrl = `/api/files/${file.id}/download`;
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = file.original_name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download error:', error);
        }
    };

    const handleOpenInNewTab = () => {
        if (previewUrl) {
            window.open(previewUrl, '_blank');
        }
    };

    if (!file) return null;

    const canPreview = isImageFile(file.mime_type) || isPdfFile(file.mime_type);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                <DialogHeader className="p-6 pb-0">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-lg font-semibold truncate">
                                {file.original_name}
                            </DialogTitle>
                            <div className="mt-1 flex items-center space-x-2 text-sm text-gray-500">
                                <span>{formatFileSize(file.file_size)}</span>
                                <span>•</span>
                                <span>{getFileTypeLabel(file.mime_type)}</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownload}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                            </Button>

                            {previewUrl && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleOpenInNewTab}
                                >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Abrir
                                </Button>
                            )}

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                                className="h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 p-6 pt-4">
                    {isLoading && (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <p className="text-red-600 mb-2">{error}</p>
                                <Button variant="outline" onClick={handleDownload}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Fazer Download
                                </Button>
                            </div>
                        </div>
                    )}

                    {!isLoading && !error && previewUrl && (
                        <div className="w-full h-full">
                            {isImageFile(file.mime_type) && (
                                <div className="flex items-center justify-center">
                                    <img
                                        src={previewUrl}
                                        alt={file.original_name}
                                        className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                                        onError={() => setError('Erro ao carregar imagem')}
                                    />
                                </div>
                            )}

                            {isPdfFile(file.mime_type) && (
                                <div className="w-full h-[60vh] border rounded-lg overflow-hidden">
                                    <iframe
                                        src={previewUrl}
                                        className="w-full h-full"
                                        title={file.original_name}
                                        onError={() => setError('Erro ao carregar PDF')}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {!canPreview && (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <p className="text-gray-600 mb-4">
                                    Preview não disponível para este tipo de arquivo
                                </p>
                                <Button onClick={handleDownload}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Fazer Download
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}