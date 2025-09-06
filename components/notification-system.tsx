"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
    CheckCircle,
    AlertCircle,
    Info,
    AlertTriangle,
    X,
    Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface Notification {
    id: string
    type: NotificationType
    title?: string
    message: string
    duration?: number
    persistent?: boolean
    action?: {
        label: string
        onClick: () => void
    }
}

interface NotificationProps {
    notification: Notification
    onDismiss: (id: string) => void
}

function NotificationItem({ notification, onDismiss }: NotificationProps) {
    const { id, type, title, message, duration = 5000, persistent = false, action } = notification

    useEffect(() => {
        if (!persistent && duration > 0) {
            const timer = setTimeout(() => {
                onDismiss(id)
            }, duration)

            return () => clearTimeout(timer)
        }
    }, [id, duration, persistent, onDismiss])

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="h-4 w-4" />
            case 'error':
                return <AlertCircle className="h-4 w-4" />
            case 'warning':
                return <AlertTriangle className="h-4 w-4" />
            case 'info':
                return <Info className="h-4 w-4" />
            case 'loading':
                return <Loader2 className="h-4 w-4 animate-spin" />
            default:
                return <Info className="h-4 w-4" />
        }
    }

    const getVariant = () => {
        switch (type) {
            case 'error':
                return 'destructive'
            case 'warning':
                return 'default'
            default:
                return 'default'
        }
    }

    const getColorClasses = () => {
        switch (type) {
            case 'success':
                return 'border-green-200 bg-green-50 text-green-800'
            case 'error':
                return 'border-red-200 bg-red-50 text-red-800'
            case 'warning':
                return 'border-yellow-200 bg-yellow-50 text-yellow-800'
            case 'info':
                return 'border-blue-200 bg-blue-50 text-blue-800'
            case 'loading':
                return 'border-blue-200 bg-blue-50 text-blue-800'
            default:
                return ''
        }
    }

    return (
        <Alert
            variant={getVariant()}
            className={cn(
                "relative pr-12 transition-all duration-300 ease-in-out",
                getColorClasses()
            )}
        >
            {getIcon()}
            <div className="flex-1">
                {title && <div className="font-medium mb-1">{title}</div>}
                <AlertDescription className="text-sm">
                    {message}
                </AlertDescription>
                {action && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={action.onClick}
                        className="mt-2"
                    >
                        {action.label}
                    </Button>
                )}
            </div>

            {!persistent && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDismiss(id)}
                    className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-transparent"
                >
                    <X className="h-3 w-3" />
                </Button>
            )}
        </Alert>
    )
}

interface NotificationContainerProps {
    notifications: Notification[]
    onDismiss: (id: string) => void
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center'
    className?: string
}

export function NotificationContainer({
    notifications,
    onDismiss,
    position = 'top-right',
    className
}: NotificationContainerProps) {
    const getPositionClasses = () => {
        switch (position) {
            case 'top-right':
                return 'fixed top-4 right-4 z-50'
            case 'top-left':
                return 'fixed top-4 left-4 z-50'
            case 'bottom-right':
                return 'fixed bottom-4 right-4 z-50'
            case 'bottom-left':
                return 'fixed bottom-4 left-4 z-50'
            case 'top-center':
                return 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50'
            default:
                return 'fixed top-4 right-4 z-50'
        }
    }

    if (notifications.length === 0) return null

    return (
        <div className={cn(getPositionClasses(), className)}>
            <div className="space-y-2 w-80 max-w-sm">
                {notifications.map((notification) => (
                    <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onDismiss={onDismiss}
                    />
                ))}
            </div>
        </div>
    )
}

// Hook for managing notifications
export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([])

    const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9)
        const newNotification: Notification = { ...notification, id }

        setNotifications(prev => [...prev, newNotification])
        return id
    }, [])

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }, [])

    const clearAll = useCallback(() => {
        setNotifications([])
    }, [])

    // Convenience methods
    const success = useCallback((message: string, options?: Partial<Notification>) => {
        return addNotification({ type: 'success', message, ...options })
    }, [addNotification])

    const error = useCallback((message: string, options?: Partial<Notification>) => {
        return addNotification({ type: 'error', message, persistent: true, ...options })
    }, [addNotification])

    const warning = useCallback((message: string, options?: Partial<Notification>) => {
        return addNotification({ type: 'warning', message, ...options })
    }, [addNotification])

    const info = useCallback((message: string, options?: Partial<Notification>) => {
        return addNotification({ type: 'info', message, ...options })
    }, [addNotification])

    const loading = useCallback((message: string, options?: Partial<Notification>) => {
        return addNotification({ type: 'loading', message, persistent: true, ...options })
    }, [addNotification])

    return {
        notifications,
        addNotification,
        removeNotification,
        clearAll,
        success,
        error,
        warning,
        info,
        loading,
    }
}

// Inline notification component for forms
interface InlineNotificationProps {
    type: NotificationType
    message: string
    className?: string
    onDismiss?: () => void
}

export function InlineNotification({ type, message, className, onDismiss }: InlineNotificationProps) {
    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-600" />
            case 'error':
                return <AlertCircle className="h-4 w-4 text-red-600" />
            case 'warning':
                return <AlertTriangle className="h-4 w-4 text-yellow-600" />
            case 'info':
                return <Info className="h-4 w-4 text-blue-600" />
            case 'loading':
                return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            default:
                return <Info className="h-4 w-4 text-blue-600" />
        }
    }

    const getColorClasses = () => {
        switch (type) {
            case 'success':
                return 'border-green-200 bg-green-50 text-green-800'
            case 'error':
                return 'border-red-200 bg-red-50 text-red-800'
            case 'warning':
                return 'border-yellow-200 bg-yellow-50 text-yellow-800'
            case 'info':
                return 'border-blue-200 bg-blue-50 text-blue-800'
            case 'loading':
                return 'border-blue-200 bg-blue-50 text-blue-800'
            default:
                return ''
        }
    }

    return (
        <div className={cn(
            "flex items-center space-x-2 p-3 rounded-md border text-sm",
            getColorClasses(),
            className
        )}>
            {getIcon()}
            <span className="flex-1">{message}</span>
            {onDismiss && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDismiss}
                    className="h-6 w-6 p-0 hover:bg-transparent"
                >
                    <X className="h-3 w-3" />
                </Button>
            )}
        </div>
    )
}