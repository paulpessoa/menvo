"use client"

import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import { ValidationErrors } from '@/hooks/useFormValidation'

interface ValidationSummaryProps {
    errors: ValidationErrors
    isValid: boolean
    isDirty: boolean
    className?: string
    onFieldClick?: (fieldId: string) => void
}

export function ValidationSummary({
    errors,
    isValid,
    isDirty,
    className,
    onFieldClick
}: ValidationSummaryProps) {
    const errorCount = Object.keys(errors).length

    if (!isDirty) {
        return null
    }

    const handleFieldClick = (fieldId: string) => {
        if (onFieldClick) {
            onFieldClick(fieldId)
        } else {
            // Default behavior: scroll to field
            const element = document.getElementById(fieldId)
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element?.focus()
        }
    }

    if (isValid) {
        return (
            <Alert className={className}>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                    <strong>Formulário válido!</strong> Todos os campos obrigatórios foram preenchidos corretamente.
                </AlertDescription>
            </Alert>
        )
    }

    if (errorCount === 0) {
        return null
    }

    return (
        <Alert variant="destructive" className={className}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
                <div className="space-y-2">
                    <div>
                        <strong>
                            {errorCount === 1
                                ? 'Há 1 erro no formulário:'
                                : `Há ${errorCount} erros no formulário:`
                            }
                        </strong>
                    </div>

                    <ul className="space-y-1 ml-4">
                        {Object.entries(errors).map(([field, error]) => (
                            <li key={field} className="text-sm">
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => handleFieldClick(field)}
                                    className="h-auto p-0 text-red-700 hover:text-red-900 underline"
                                >
                                    {getFieldLabel(field)}: {error}
                                </Button>
                            </li>
                        ))}
                    </ul>
                </div>
            </AlertDescription>
        </Alert>
    )
}

// Helper function to get user-friendly field labels
function getFieldLabel(fieldId: string): string {
    const labels: Record<string, string> = {
        first_name: 'Nome',
        last_name: 'Sobrenome',
        email: 'E-mail',
        phone: 'Telefone',
        bio: 'Biografia',
        current_position: 'Cargo atual',
        current_company: 'Empresa atual',
        location: 'Localização',
        linkedin_url: 'LinkedIn',
        github_url: 'GitHub',
        website_url: 'Website',
        skills: 'Habilidades',
        experience_years: 'Anos de experiência',
        education: 'Educação',
        languages: 'Idiomas',
        availability: 'Disponibilidade',
        mentorship_approach: 'Abordagem de mentoria',
        what_to_expect: 'O que esperar',
        ideal_mentee: 'Mentee ideal',
        // Add more field mappings as needed
    }

    return labels[fieldId] || fieldId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

interface RequiredFieldIndicatorProps {
    required?: boolean
    className?: string
}

export function RequiredFieldIndicator({ required = false, className }: RequiredFieldIndicatorProps) {
    if (!required) return null

    return (
        <span className={`text-red-500 ml-1 ${className}`} title="Campo obrigatório">
            *
        </span>
    )
}

interface FormProgressProps {
    totalFields: number
    completedFields: number
    requiredFields: number
    completedRequiredFields: number
    className?: string
}

export function FormProgress({
    totalFields,
    completedFields,
    requiredFields,
    completedRequiredFields,
    className
}: FormProgressProps) {
    const overallProgress = (completedFields / totalFields) * 100
    const requiredProgress = (completedRequiredFields / requiredFields) * 100

    return (
        <div className={`space-y-3 ${className}`}>
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Progresso do formulário</span>
                <span className="text-gray-600">
                    {completedFields} de {totalFields} campos preenchidos
                </span>
            </div>

            <div className="space-y-2">
                {/* Overall progress */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                        <span>Geral</span>
                        <span>{Math.round(overallProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${overallProgress}%` }}
                        />
                    </div>
                </div>

                {/* Required fields progress */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                        <span>Campos obrigatórios</span>
                        <span>{completedRequiredFields} de {requiredFields}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${requiredProgress === 100 ? 'bg-green-600' : 'bg-orange-500'
                                }`}
                            style={{ width: `${requiredProgress}%` }}
                        />
                    </div>
                </div>
            </div>

            {requiredProgress < 100 && (
                <div className="flex items-center space-x-2 text-sm text-orange-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Complete todos os campos obrigatórios para salvar</span>
                </div>
            )}
        </div>
    )
}
