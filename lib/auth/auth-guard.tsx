"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './auth-context'

interface AuthGuardProps {
    children: React.ReactNode
    requireRole?: boolean
    allowedRoles?: ('mentor' | 'mentee' | 'admin')[]
    requireVerified?: boolean
    fallback?: React.ReactNode
}

export function AuthGuard({
    children,
    requireRole = false,
    allowedRoles = [],
    requireVerified = false,
    fallback
}: AuthGuardProps) {
    const auth = useAuth()
    const router = useRouter()

    // Show loading state while initializing
    if (auth.isInitializing) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    // Redirect to login if not authenticated
    if (!auth.isAuthenticated) {
        router.push('/auth/login')
        return null
    }

    // Redirect to role selection if role is required but not set
    if (requireRole && auth.needsRoleSelection()) {
        router.push('/auth/select-role')
        return null
    }

    // Check if user has required role
    if (allowedRoles.length > 0 && !auth.hasAnyRole(allowedRoles)) {
        if (fallback) {
            return <>{fallback}</>
        }

        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        Acesso Negado
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Você não tem permissão para acessar esta página.
                    </p>
                    <button
                        onClick={() => router.back()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Voltar
                    </button>
                </div>
            </div>
        )
    }

    // Check if mentor verification is required (simplified for MVP)
    if (requireVerified && auth.isMentor() && !auth.isVerified) {
        if (fallback) {
            return <>{fallback}</>
        }

        // For MVP, just show a simple message but allow access
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <div className="flex">
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                            Verificação Pendente
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                            <p>Seu perfil está aguardando verificação, mas você já pode usar a plataforma.</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // All checks passed, render children
    return <>{children}</>
}

// Convenience components for common use cases
export function RequireAuth({ children }: { children: React.ReactNode }) {
    return <AuthGuard>{children}</AuthGuard>
}

export function RequireRole({
    children,
    roles
}: {
    children: React.ReactNode
    roles: ('mentor' | 'mentee' | 'admin')[]
}) {
    return (
        <AuthGuard requireRole allowedRoles={roles}>
            {children}
        </AuthGuard>
    )
}

export function RequireVerifiedMentor({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard requireRole allowedRoles={['mentor']} requireVerified>
            {children}
        </AuthGuard>
    )
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard requireRole allowedRoles={['admin']}>
            {children}
        </AuthGuard>
    )
}
