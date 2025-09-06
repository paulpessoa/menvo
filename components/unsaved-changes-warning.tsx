"use client"

import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Save, RotateCcw } from 'lucide-react'

interface UnsavedChangesWarningProps {
    hasUnsavedChanges: boolean
    onSave?: () => void
    onDiscard?: () => void
    isSaving?: boolean
    className?: string
}

export function UnsavedChangesWarning({
    hasUnsavedChanges,
    onSave,
    onDiscard,
    isSaving = false,
    className
}: UnsavedChangesWarningProps) {
    if (!hasUnsavedChanges) {
        return null
    }

    return (
        <Alert className={`border-orange-200 bg-orange-50 ${className}`}>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="flex items-center justify-between">
                <div className="flex-1">
                    <span className="font-medium text-orange-800">
                        Você tem alterações não salvas
                    </span>
                    <p className="text-sm text-orange-700 mt-1">
                        Suas alterações serão perdidas se você sair sem salvar.
                    </p>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                    {onDiscard && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onDiscard}
                            disabled={isSaving}
                            className="text-orange-700 border-orange-300 hover:bg-orange-100"
                        >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Descartar
                        </Button>
                    )}

                    {onSave && (
                        <Button
                            size="sm"
                            onClick={onSave}
                            disabled={isSaving}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            <Save className="h-3 w-3 mr-1" />
                            {isSaving ? 'Salvando...' : 'Salvar'}
                        </Button>
                    )}
                </div>
            </AlertDescription>
        </Alert>
    )
}

// Sticky version that stays at the top
interface StickyUnsavedWarningProps extends UnsavedChangesWarningProps {
    show: boolean
}

export function StickyUnsavedWarning({
    show,
    hasUnsavedChanges,
    onSave,
    onDiscard,
    isSaving,
    className
}: StickyUnsavedWarningProps) {
    if (!show || !hasUnsavedChanges) {
        return null
    }

    return (
        <div className={`fixed top-0 left-0 right-0 z-40 ${className}`}>
            <UnsavedChangesWarning
                hasUnsavedChanges={hasUnsavedChanges}
                onSave={onSave}
                onDiscard={onDiscard}
                isSaving={isSaving}
                className="rounded-none border-x-0 border-t-0"
            />
        </div>
    )
}

// Floating action button version
interface FloatingUnsavedButtonProps {
    hasUnsavedChanges: boolean
    onSave?: () => void
    isSaving?: boolean
    className?: string
}

export function FloatingUnsavedButton({
    hasUnsavedChanges,
    onSave,
    isSaving = false,
    className
}: FloatingUnsavedButtonProps) {
    if (!hasUnsavedChanges || !onSave) {
        return null
    }

    return (
        <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
            <Button
                onClick={onSave}
                disabled={isSaving}
                size="lg"
                className="shadow-lg bg-orange-600 hover:bg-orange-700 text-white rounded-full px-6"
            >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
        </div>
    )
}