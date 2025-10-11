"use client";

import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FileUpload } from '@/components/files/file-upload';
import { FileCard } from '@/components/files/file-card';
import { FilePreviewModal } from '@/components/files/file-preview-modal';
import { UserFile, FileListResponse } from '@/types/user-files';

export default function MeusArquivosPage() {
    const [files, setFiles] = useState<UserFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalFiles, setTotalFiles] = useState(0);
    const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<UserFile | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const { toast } = useToast();
    const filesPerPage = 20;

    // Load files
    const loadFiles = async (page = 1, search = '', showLoading = true) => {
        try {
            if (showLoading) {
                setIsLoading(true);
            } else {
                setIsRefreshing(true);
            }

            const params = new URLSearchParams({
                page: page.toString(),
                limit: filesPerPage.toString(),
            });

            if (search.trim()) {
                params.append('search', search.trim());
            }

            const response = await fetch(`/api/files?${params}`);
            const data: FileListResponse | { error: string } = await response.json();

            if ('error' in data) {
                throw new Error(data.error);
            }

            setFiles(data.files);
            setTotalFiles(data.total);
            setCurrentPage(page);
        } catch (error) {
            console.error('Error loading files:', error);
            toast({
                title: 'Erro',
                description: 'Erro ao carregar arquivos. Tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    // Initial load
    useEffect(() => {
        loadFiles(1, searchTerm);
    }, []);

    // Search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== '') {
                loadFiles(1, searchTerm);
            } else {
                loadFiles(1, '');
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Handle file upload success
    const handleUploadSuccess = (file: UserFile) => {
        setFiles(prev => [file, ...prev]);
        setTotalFiles(prev => prev + 1);
        toast({
            title: 'Sucesso',
            description: 'Arquivo enviado com sucesso!',
        });
    };

    // Handle file upload error
    const handleUploadError = (error: string) => {
        toast({
            title: 'Erro no upload',
            description: error,
            variant: 'destructive',
        });
    };

    // Handle file deletion
    const handleFileDelete = async (fileId: string) => {
        try {
            setDeletingFileId(fileId);

            const response = await fetch(`/api/files/${fileId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Erro ao excluir arquivo');
            }

            // Remove file from list
            setFiles(prev => prev.filter(f => f.id !== fileId));
            setTotalFiles(prev => prev - 1);

            toast({
                title: 'Sucesso',
                description: 'Arquivo excluído com sucesso!',
            });
        } catch (error) {
            console.error('Error deleting file:', error);
            toast({
                title: 'Erro',
                description: error instanceof Error ? error.message : 'Erro ao excluir arquivo',
                variant: 'destructive',
            });
        } finally {
            setDeletingFileId(null);
        }
    };

    // Handle file preview
    const handleFilePreview = (file: UserFile) => {
        setPreviewFile(file);
        setIsPreviewOpen(true);
    };

    // Handle refresh
    const handleRefresh = () => {
        loadFiles(currentPage, searchTerm, false);
    };

    // Handle pagination
    const handlePageChange = (newPage: number) => {
        loadFiles(newPage, searchTerm);
    };

    const totalPages = Math.ceil(totalFiles / filesPerPage);

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Arquivos</h1>
                <p className="text-gray-600">
                    Gerencie seus documentos e arquivos de forma organizada
                </p>
            </div>

            {/* Upload Section */}
            <div className="mb-8">
                <FileUpload
                    onUploadSuccess={handleUploadSuccess}
                    onUploadError={handleUploadError}
                />
            </div>

            {/* Search and Actions */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex-1 max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Buscar arquivos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                </div>
            </div>

            {/* Files List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Arquivos ({totalFiles})</span>
                        {totalPages > 1 && (
                            <span className="text-sm font-normal text-gray-500">
                                Página {currentPage} de {totalPages}
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : files.length === 0 ? (
                        <div className="text-center py-12">
                            <FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {searchTerm ? 'Nenhum arquivo encontrado' : 'Nenhum arquivo ainda'}
                            </h3>
                            <p className="text-gray-500">
                                {searchTerm
                                    ? 'Tente buscar com outros termos'
                                    : 'Faça upload do seu primeiro arquivo usando o botão acima'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {files.map((file) => (
                                <FileCard
                                    key={file.id}
                                    file={file}
                                    onDelete={handleFileDelete}
                                    onPreview={handleFilePreview}
                                    isDeleting={deletingFileId === file.id}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center space-x-2 mt-6">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1 || isLoading}
                            >
                                Anterior
                            </Button>

                            <span className="text-sm text-gray-600">
                                {currentPage} de {totalPages}
                            </span>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages || isLoading}
                            >
                                Próxima
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Preview Modal */}
            <FilePreviewModal
                file={previewFile}
                isOpen={isPreviewOpen}
                onClose={() => {
                    setIsPreviewOpen(false);
                    setPreviewFile(null);
                }}
            />
        </div>
    );
}