"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, ExternalLink } from 'lucide-react'

interface PdfViewerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    pdfUrl: string
    title?: string
}

export function PdfViewerDialog({
    open,
    onOpenChange,
    pdfUrl,
    title = 'Visualizar PDF'
}: PdfViewerDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>{title}</span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                            >
                                <a
                                    href={pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Abrir em nova aba
                                </a>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                            >
                                <a
                                    href={pdfUrl}
                                    download
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Baixar
                                </a>
                            </Button>
                        </div>
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-hidden rounded-md border">
                    <iframe
                        src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                        className="w-full h-full"
                        title={title}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
