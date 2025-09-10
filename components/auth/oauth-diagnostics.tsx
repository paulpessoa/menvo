'use client'

/**
 * OAuth Diagnostics Component
 * 
 * This component provides real-time OAuth diagnostics and testing
 * capabilities for debugging authentication issues.
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react'

interface OAuthProviderStatus {
    configured: boolean
    available: boolean
    error?: string
    warnings: string[]
    testUrl?: string
}

interface DiagnosticsData {
    providers: Record<string, OAuthProviderStatus>
    environment: {
        isDevelopment: boolean
        siteUrl: string
        supabaseUrl: string
    }
    lastUpdated: string
}

export function OAuthDiagnostics() {
    const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null)
    const [loading, setLoading] = useState(false)
    const [testingProvider, setTestingProvider] = useState<string | null>(null)

    const runDiagnostics = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/auth/diagnostics')
            const data = await response.json()
            setDiagnostics(data)
        } catch (error) {
            console.error('Failed to run diagnostics:', error)
        } finally {
            setLoading(false)
        }
    }

    const testProvider = async (provider: string) => {
        setTestingProvider(provider)
        try {
            const response = await fetch(`/api/auth/${provider}/test`, {
                method: 'POST'
            })
            const result = await response.json()

            if (result.success) {
                // Update the provider status
                setDiagnostics(prev => prev ? {
                    ...prev,
                    providers: {
                        ...prev.providers,
                        [provider]: {
                            ...prev.providers[provider],
                            available: true,
                            testUrl: result.url,
                            error: undefined
                        }
                    }
                } : null)
            } else {
                setDiagnostics(prev => prev ? {
                    ...prev,
                    providers: {
                        ...prev.providers,
                        [provider]: {
                            ...prev.providers[provider],
                            available: false,
                            error: result.error
                        }
                    }
                } : null)
            }
        } catch (error) {
            console.error(`Failed to test ${provider}:`, error)
        } finally {
            setTestingProvider(null)
        }
    }

    useEffect(() => {
        runDiagnostics()
    }, [])

    if (!diagnostics) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                        OAuth Diagnostics
                    </CardTitle>
                    <CardDescription>
                        Loading OAuth provider diagnostics...
                    </CardDescription>
                </CardHeader>
            </Card>
        )
    }

    const getStatusIcon = (provider: OAuthProviderStatus) => {
        if (!provider.configured) {
            return <XCircle className="h-4 w-4 text-red-500" />
        }
        if (provider.error) {
            return <XCircle className="h-4 w-4 text-red-500" />
        }
        if (provider.warnings.length > 0) {
            return <AlertTriangle className="h-4 w-4 text-yellow-500" />
        }
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }

    const getStatusBadge = (provider: OAuthProviderStatus) => {
        if (!provider.configured) {
            return <Badge variant="destructive">Not Configured</Badge>
        }
        if (provider.error) {
            return <Badge variant="destructive">Error</Badge>
        }
        if (provider.warnings.length > 0) {
            return <Badge variant="secondary">Warning</Badge>
        }
        return <Badge variant="default">Ready</Badge>
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <RefreshCw className="h-5 w-5" />
                            OAuth Diagnostics
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={runDiagnostics}
                            disabled={loading}
                        >
                            {loading ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                'Refresh'
                            )}
                        </Button>
                    </CardTitle>
                    <CardDescription>
                        Real-time OAuth provider status and diagnostics
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium">Environment:</span> {diagnostics.environment.isDevelopment ? 'Development' : 'Production'}
                            </div>
                            <div>
                                <span className="font-medium">Last Updated:</span> {new Date(diagnostics.lastUpdated).toLocaleTimeString()}
                            </div>
                            <div className="col-span-2">
                                <span className="font-medium">Site URL:</span> {diagnostics.environment.siteUrl}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4">
                        {Object.entries(diagnostics.providers).map(([provider, status]) => (
                            <Card key={provider}>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {getStatusIcon(status)}
                                            <div>
                                                <h3 className="font-medium capitalize">{provider}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    OAuth Provider
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(status)}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => testProvider(provider)}
                                                disabled={testingProvider === provider || !status.configured}
                                            >
                                                {testingProvider === provider ? (
                                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    'Test'
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {status.error && (
                                        <Alert variant="destructive" className="mt-3">
                                            <AlertDescription>{status.error}</AlertDescription>
                                        </Alert>
                                    )}

                                    {status.warnings.length > 0 && (
                                        <Alert className="mt-3">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertDescription>
                                                <ul className="list-disc list-inside space-y-1">
                                                    {status.warnings.map((warning, index) => (
                                                        <li key={index}>{warning}</li>
                                                    ))}
                                                </ul>
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {status.testUrl && (
                                        <div className="mt-3 p-2 bg-muted rounded text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Test URL:</span>
                                                <a
                                                    href={status.testUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline flex items-center gap-1"
                                                >
                                                    Open <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuration Details</CardTitle>
                            <CardDescription>
                                Detailed OAuth configuration information
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-medium mb-2">Environment Variables</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium">NEXT_PUBLIC_SUPABASE_URL:</span>
                                            <div className="text-muted-foreground break-all">
                                                {diagnostics.environment.supabaseUrl}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="font-medium">NEXT_PUBLIC_SITE_URL:</span>
                                            <div className="text-muted-foreground">
                                                {diagnostics.environment.siteUrl}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-2">Expected Redirect URIs</h4>
                                    <div className="space-y-1 text-sm">
                                        <div className="text-muted-foreground">
                                            {diagnostics.environment.siteUrl}/auth/callback
                                        </div>
                                        <div className="text-muted-foreground">
                                            {diagnostics.environment.supabaseUrl}/auth/v1/callback
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-2">Provider Status</h4>
                                    <div className="space-y-3">
                                        {Object.entries(diagnostics.providers).map(([provider, status]) => (
                                            <div key={provider} className="border rounded p-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {getStatusIcon(status)}
                                                    <span className="font-medium capitalize">{provider}</span>
                                                    {getStatusBadge(status)}
                                                </div>
                                                <div className="text-sm space-y-1">
                                                    <div>Configured: {status.configured ? 'Yes' : 'No'}</div>
                                                    <div>Available: {status.available ? 'Yes' : 'No'}</div>
                                                    {status.error && (
                                                        <div className="text-red-600">Error: {status.error}</div>
                                                    )}
                                                    {status.warnings.length > 0 && (
                                                        <div className="text-yellow-600">
                                                            Warnings: {status.warnings.join(', ')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default OAuthDiagnostics