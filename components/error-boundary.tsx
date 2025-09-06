"use client"

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { logError } from '@/lib/error-handler';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        logError(error, 'ErrorBoundary', { errorInfo });

        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    resetError = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                const FallbackComponent = this.props.fallback;
                return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
            }

            return <DefaultErrorFallback error={this.state.error!} resetError={this.resetError} />;
        }

        return this.props.children;
    }
}

interface DefaultErrorFallbackProps {
    error: Error;
    resetError: () => void;
}

function DefaultErrorFallback({ error, resetError }: DefaultErrorFallbackProps) {
    return (
        <div className="flex items-center justify-center min-h-[200px] p-4">
            <div className="max-w-md w-full">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="mb-4">
                        Ops! Algo deu errado. Tente recarregar a página ou entre em contato com o suporte se o problema persistir.
                    </AlertDescription>
                </Alert>

                <div className="mt-4 space-y-2">
                    <Button onClick={resetError} variant="outline" className="w-full">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Tentar Novamente
                    </Button>

                    <Button
                        onClick={() => window.location.reload()}
                        variant="secondary"
                        className="w-full"
                    >
                        Recarregar Página
                    </Button>
                </div>

                {process.env.NODE_ENV === 'development' && (
                    <details className="mt-4 p-2 bg-gray-100 rounded text-sm">
                        <summary className="cursor-pointer font-medium">Detalhes do erro (desenvolvimento)</summary>
                        <pre className="mt-2 whitespace-pre-wrap text-xs">{error.stack}</pre>
                    </details>
                )}
            </div>
        </div>
    );
}

// Hook para usar error boundary programaticamente
export function useErrorHandler() {
    return (error: Error, context?: string) => {
        logError(error, context);
        throw error; // Re-throw to be caught by ErrorBoundary
    };
}