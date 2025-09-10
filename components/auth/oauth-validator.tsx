'use client'

/**
 * OAuth Validator Component
 * 
 * This component validates OAuth configuration on the client side
 * and displays warnings/errors in development mode.
 */

import { useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface OAuthValidationResult {
    status: 'loading' | 'healthy' | 'warning' | 'error'
    message: string
    details?: any
}

export function OAuthValidator() {
    const [validation, setValidation] = useState<OAuthValidationResult>({
        status: 'loading',
        message: 'Validating OAuth configuration...'
    })

    useEffect(() => {
        // Only run validation in development
        if (process.env.NODE_ENV !== 'development') {
            return
        }

        async function validateOAuth() {
            try {
                const response = await fetch('/api/auth/health')
                const data = await response.json()

                if (data.status === 'error') {
                    setValidation({
                        status: 'error',
                        message: 'OAuth configuration has errors',
                        details: data
                    })
                } else if (data.status === 'warning') {
                    setValidation({
                        status: 'warning',
                        message: 'OAuth configuration has warnings',
                        details: data
                    })
                } else {
                    setValidation({
                        status: 'healthy',
                        message: 'OAuth configuration is healthy',
                        details: data
                    })
                }
            } catch (error) {
                setValidation({
                    status: 'error',
                    message: 'Failed to validate OAuth configuration',
                    details: { error: error.message }
                })
            }
        }

        validateOAuth()
    }, [])

    // Don't render anything in production
    if (process.env.NODE_ENV === 'production') {
        return null
    }

    // Don't render if healthy or still loading
    if (validation.status === 'loading' || validation.status === 'healthy') {
        return null
    }

    const getIcon = () => {
        switch (validation.status) {
            case 'error':
                return <XCircle className="h-4 w-4" />
            case 'warning':
                return <AlertTriangle className="h-4 w-4" />
            default:
                return <CheckCircle className="h-4 w-4" />
        }
    }

    const getVariant = () => {
        return validation.status === 'error' ? 'destructive' : 'default'
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-md">
            <Alert variant={getVariant()}>
                {getIcon()}
                <AlertTitle>OAuth Configuration {validation.status === 'error' ? 'Error' : 'Warning'}</AlertTitle>
                <AlertDescription>
                    <div className="space-y-2">
                        <p>{validation.message}</p>
                        {validation.details?.summary && (
                            <div className="text-sm">
                                <p>Enabled providers: {validation.details.summary.enabled}/{validation.details.summary.total}</p>
                                {validation.details.summary.errors > 0 && (
                                    <p className="text-red-600">Errors: {validation.details.summary.errors}</p>
                                )}
                                {validation.details.summary.warnings > 0 && (
                                    <p className="text-yellow-600">Warnings: {validation.details.summary.warnings}</p>
                                )}
                            </div>
                        )}
                        <p className="text-xs opacity-75">
                            Run <code>node scripts/validation/validate-oauth-config.js</code> for details
                        </p>
                    </div>
                </AlertDescription>
            </Alert>
        </div>
    )
}

/**
 * OAuth Status Badge Component
 * 
 * A smaller component that shows OAuth status in the header/footer
 */
export function OAuthStatusBadge() {
    const [status, setStatus] = useState<'unknown' | 'healthy' | 'warning' | 'error'>('unknown')

    useEffect(() => {
        if (process.env.NODE_ENV !== 'development') {
            return
        }

        async function checkStatus() {
            try {
                const response = await fetch('/api/auth/health')
                const data = await response.json()
                setStatus(data.status)
            } catch {
                setStatus('error')
            }
        }

        checkStatus()
    }, [])

    if (process.env.NODE_ENV === 'production' || status === 'unknown' || status === 'healthy') {
        return null
    }

    const getColor = () => {
        switch (status) {
            case 'error':
                return 'bg-red-500'
            case 'warning':
                return 'bg-yellow-500'
            default:
                return 'bg-green-500'
        }
    }

    return (
        <div className="fixed top-4 right-4 z-50">
            <div className={`${getColor()} text-white px-2 py-1 rounded text-xs font-medium`}>
                OAuth: {status}
            </div>
        </div>
    )
}