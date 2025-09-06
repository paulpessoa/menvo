"use client"

import React from 'react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2, Upload, Download } from 'lucide-react'

export interface ConfirmationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: 'destructive' | 'default'
    icon?: 'warning' | 'delete' | 'upload' | 'download'
    onConfirm: () => void
    onCancel?: () => void
}

export function ConfirmationDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = 'default',
    icon = 'warning',
    onConfirm,
    onCancel
}: ConfirmationDialogProps) {

    const handleConfirm = () => {
        onConfirm()
        onOpenChange(false)
    }

    const handleCancel = () => {
        onCancel?.()
        onOpenChange(false)
    }

    const getIcon = () => {
        switch (icon) {
            case 'delete':
                return <Trash2 className="h-6 w-6 text-red-600" />
            case 'upload':
                return <Upload className="h-6 w-6 text-blue-600" />
            case 'download':
                return <Download className="h-6 w-6 text-green-600" />
            case 'warning':
            default:
                return <AlertTriangle className="h-6 w-6 text-yellow-600" />
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center space-x-3">
                        {getIcon()}
                        <AlertDialogTitle>{title}</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-left">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleCancel}>
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className={variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

// Convenience hook for confirmation dialogs
export function useConfirmationDialog() {
    const [dialogState, setDialogState] = React.useState<{
        open: boolean
        props: Omit<ConfirmationDialogProps, 'open' | 'onOpenChange'>
    }>({
        open: false,
        props: {
            title: '',
            description: '',
            onConfirm: () => { }
        }
    })

    const showConfirmation = React.useCallback((props: Omit<ConfirmationDialogProps, 'open' | 'onOpenChange'>) => {
        setDialogState({
            open: true,
            props
        })
    }, [])

    const hideConfirmation = React.useCallback(() => {
        setDialogState(prev => ({ ...prev, open: false }))
    }, [])

    const ConfirmationDialogComponent = React.useCallback(() => (
        <ConfirmationDialog
            {...dialogState.props}
            open={dialogState.open}
            onOpenChange={hideConfirmation}
        />
    ), [dialogState, hideConfirmation])

    return {
        showConfirmation,
        hideConfirmation,
        ConfirmationDialog: ConfirmationDialogComponent
    }
}