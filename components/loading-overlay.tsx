"use client"

import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingOverlayProps {
    isLoading: boolean
    message?: string
    className?: string
    children: React.ReactNode
}

export function LoadingOverlay({
    isLoading,
    message = "Carregando...",
    className,
    children
}: LoadingOverlayProps) {
    return (
        <div className={cn("relative", className)}>
            {children}
            {isLoading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
                    <div className="flex flex-col items-center space-y-2">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        <p className="text-sm text-gray-600 font-medium">{message}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading: boolean
    loadingText?: string
    children: React.ReactNode
}

export function LoadingButton({
    isLoading,
    loadingText = "Carregando...",
    children,
    disabled,
    className,
    ...props
}: LoadingButtonProps) {
    return (
        <button
            {...props}
            disabled={disabled || isLoading}
            className={cn(
                "inline-flex items-center justify-center",
                isLoading && "cursor-not-allowed opacity-70",
                className
            )}
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {loadingText}
                </>
            ) : (
                children
            )}
        </button>
    )
}

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8'
    }

    return (
        <Loader2 className={cn(
            "animate-spin text-blue-600",
            sizeClasses[size],
            className
        )} />
    )
}

interface ProgressBarProps {
    progress: number
    className?: string
    showPercentage?: boolean
}

export function ProgressBar({ progress, className, showPercentage = true }: ProgressBarProps) {
    return (
        <div className={cn("space-y-2", className)}>
            {showPercentage && (
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Progresso</span>
                    <span>{Math.round(progress)}%</span>
                </div>
            )}
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
            </div>
        </div>
    )
}
