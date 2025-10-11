"use client";

import React, { useState } from 'react';
import { Download, Trash2, Eye, FileText, Image, File as FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { UserFile, formatFileSize, getFileTypeLabel, isImageFile, isPdfFile } from '@/types/user-files';

interface FileCardProps {
    file: UserFile;
    onDelete?: (fileId: string) => void;
    onPreview?: (file: UserFile) => void;
    isDeleting?: boolean;
}

export function FileCard({ file, onDelete, onPreview, isDeleting = false }: FileCardProps) {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        try {
            setIsDownloading(true);

            // Create a temporary link to trigger download
            const downloadUrl = `/api/files/${file.id}/download`;
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = file.original_name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download error:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDelete = () => {
        if (onDelete) {
            onDelete(file.id);
        }
    };

    const handlePreview = () => {
        if (onPreview && (isImageFile(file.mime_type) || isPdfFile(file.mime_type))) {
            onPreview(file);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getFileIcon = () => {
        if (isImageFile(file.mime_type)) {
            return <Image className="h-8 w-8 text-blue-500" />;
        }
        if (isPdfFile(file.mime_type)) {
            return <FileText className="h-8 w-8 text-red-500" />;
        }
        return <FileIcon className="h-8 w-8 text-gray-500" />;
    };

    const canPreview = isImageFile(file.mime_type) || isPdfFile(file.mime_type);

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                    {/* File Icon */}
                    <div className="flex-shrink-0">
                        {getFileIcon()}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                    {file.original_name}
                                </h3>
                                <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                                    <span>{formatFileSize(file.file_size)}</span>
                                    <span>•</span>
                                    <span>{getFileTypeLabel(file.mime_type)}</span>
                                    <span>•</span>
                                    <span>{formatDate(file.created_at)}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-1 ml-2">
                                {/* Preview Button */}
                                {canPreview && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handlePreview}
                                        className="h-8 w-8 p-0"
                                        title="Visualizar"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                )}

                                {/* Download Button */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleDownload}
                                    disabled={isDownloading}
                                    className="h-8 w-8 p-0"
                                    title="Download"
                                >
                                    <Download className="h-4 w-4" />
                                </Button>

                                {/* Delete Button */}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={isDeleting}
                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            title="Excluir"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Excluir arquivo</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Tem certeza que deseja excluir o arquivo "{file.original_name}"?
                                                Esta ação não pode ser desfeita.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleDelete}
                                                className="bg-red-600 hover:bg-red-700"
                                            >
                                                Excluir
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>

                        {/* Upload Status (if not completed) */}
                        {file.upload_status !== 'completed' && (
                            <div className="mt-2">
                                {file.upload_status === 'uploading' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Enviando...
                                    </span>
                                )}
                                {file.upload_status === 'failed' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        Falha no upload
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}