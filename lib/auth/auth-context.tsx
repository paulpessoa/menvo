
"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/utils/supabase/client'
import { User, Session, Provider } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { signInWithOAuthProvider } from '@/lib/auth/oauth-provider-fixes'

export interface AuthContextType {
    user: User | null
    session: Session | null
    profile: any | null
    role: string | null
    claims: any | null
    loading: boolean
    isInitializing: boolean
    isAuthenticated: boolean
    isAdmin: boolean
    isMentor: boolean
    isMentee: boolean
    isVolunteer: boolean
    isModerator: boolean
    isVerified: boolean
    isPending: boolean
    cachedRoles: {
        admin: boolean
        mentor: boolean
        mentee: boolean
        moderator: boolean
        role: string | null
        isVerified: boolean
        roles: string[]
        isPending: boolean
    }
    signIn: (email: string, password: string) => Promise<{ success: boolean, error?: any }>
    signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ success: boolean, error?: any }>
    signInWithProvider: (provider: Provider) => Promise<{ success: boolean, error?: any }>
    signOut: () => Promise<void>
    refreshProfile: () => Promise<void>
    updateProfile: (data: any) => Promise<{ success: boolean, error?: string }>
    handleAuthError: (error: any) => string
    getDefaultRedirectPath: () => string
    getRoleDashboardPath: (role: string | null) => string
    selectRole: (role: string) => Promise<{ success: boolean, error?: string }>
    hasRole: (role: string | string[]) => boolean
    hasAnyRole: (roles: string[]) => boolean
    hasPermission: (permission: string) => boolean
    hasAnyPermission: (permissions: string[]) => boolean
    needsRoleSelection: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [profile, setProfile] = useState<any>(null)
    const [isInitializing, setIsInitializing] = useState(true)
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const EMPTY_ROLES = {
        admin: false,
        mentor: false,
        mentee: false,
        moderator: false,
        role: null as string | null,
        isVerified: false,
        roles: [] as string[],
        isPending: false
    }

    const [cachedRoles, setCachedRoles] = useState<{
        admin: boolean
        mentor: boolean
        mentee: boolean
        moderator: boolean
        role: string | null
        isVerified: boolean
        roles: string[]
        isPending: boolean
    }>(EMPTY_ROLES)

    const fetchProfile = useCallback(async (_userId?: string) => {
        try {
            const response = await fetch('/api/auth/me', {
                method: 'GET',
                credentials: 'include',
                headers: { 'Cache-Control': 'no-cache' }
            })

            if (!response.ok) {
                setCachedRoles(EMPTY_ROLES)
                setProfile(null)
                return null
            }

            const data = await response.json()
            if (!data.authenticated || !data.user) {
                setCachedRoles(EMPTY_ROLES)
                setProfile(null)
                return null
            }

            const roleNames: string[] = Array.isArray(data.roles) ? data.roles : []
            const primaryRole: string | null = data.role || null

            const roles = {
                admin: primaryRole === 'admin' || roleNames.includes('admin'),
                mentor: primaryRole === 'mentor' || roleNames.includes('mentor'),
                mentee: primaryRole === 'mentee' || roleNames.includes('mentee'),
                moderator: roleNames.includes('moderator'),
                role: primaryRole,
                isVerified: !!data.isVerified,
                isPending: !!data.isPending,
                roles: roleNames
            }

            setCachedRoles(roles)
            setProfile(data.profile)
            return data.profile
        } catch (err) {
            console.error('[Auth] Error fetching profile via API:', err)
            return null
        }
    }, [])

    const signIn = async (email: string, password: string) => {
        try {
            setLoading(true)
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) throw error
            return { success: true }
        } catch (error) { return { success: false, error } } finally { setLoading(false) }
    }

    const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
        try {
            setLoading(true)
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        full_name: `${firstName} ${lastName}`,
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                }
            })
            if (error) throw error
            return { success: true }
        } catch (error) { return { success: false, error } } finally { setLoading(false) }
    }

    const signInWithProvider = async (provider: Provider) => {
        try {
            setLoading(true)
            
            // Only support google, linkedin, and github
            if (provider !== 'google' && provider !== 'linkedin' && provider !== 'github') {
                throw new Error(`Provider ${provider} not supported`)
            }
            
            // Use the fixed OAuth provider function that handles linkedin_oidc mapping
            const result = await signInWithOAuthProvider(supabase, provider, {
                redirectTo: `${window.location.origin}/auth/callback`
            })
            if (result.error) throw result.error
            
            // Redirect to the OAuth URL
            if (result.data?.url) {
                window.location.href = result.data.url
            }
            
            return { success: true }
        } catch (error) {
            console.error('OAuth sign-in error:', error)
            return { success: false, error }
        } finally {
            setLoading(false)
        }
    }

    const signOut = async () => {
        try {
            setLoading(true)

            // 1. Invalida sessão no servidor e limpa cookies HTTP
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            }).catch(() => {})

            // 2. Invalida sessão no cliente Supabase
            await supabase.auth.signOut().catch(() => {})
        } catch (error) {
            console.error('[Auth] Logout warning:', error)
        } finally {
            // 3. Limpeza direta e infalível de cookies no navegador
            if (typeof document !== 'undefined') {
                const cookies = document.cookie.split(';')
                for (const rawCookie of cookies) {
                    const cookie = rawCookie.trim()
                    const eqPos = cookie.indexOf('=')
                    const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie
                    if (
                        name.startsWith('sb-') ||
                        name.includes('auth-token') ||
                        name.includes('supabase') ||
                        name.includes('menvo')
                    ) {
                        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax`
                        document.cookie = `${name}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax`
                    }
                }
            }

            // 4. Limpeza de LocalStorage e SessionStorage
            if (typeof window !== 'undefined') {
                localStorage.removeItem('menvo_roles')
                Object.keys(localStorage).forEach((key) => {
                    if (key.startsWith('sb-') || key.includes('supabase') || key.includes('menvo')) {
                        localStorage.removeItem(key)
                    }
                })
                Object.keys(sessionStorage).forEach((key) => {
                    if (key.startsWith('sb-') || key.includes('supabase') || key.includes('menvo')) {
                        sessionStorage.removeItem(key)
                    }
                })
            }

            // 5. Limpeza de estado em memória
            setUser(null)
            setSession(null)
            setProfile(null)
            setCachedRoles(EMPTY_ROLES)

            // 6. Redirecionamento limpo para recarregar aplicação desautenticada de primeira
            if (typeof window !== 'undefined') {
                window.location.href = '/'
            }
            setLoading(false)
        }
    }

    const hasRole = useCallback((role: string | string[]) => {
        const userRoles = cachedRoles.roles
        if (Array.isArray(role)) {
            return role.some(r => userRoles.includes(r))
        }
        return userRoles.includes(role)
    }, [cachedRoles.roles])

    const hasPermission = useCallback((permission: string) => {
        if (cachedRoles.admin) return true
        return false
    }, [cachedRoles.admin])

    const hasAnyPermission = useCallback((permissions: string[]) => {
        if (cachedRoles.admin) return true
        return false
    }, [cachedRoles.admin])

    const getRoleDashboardPath = useCallback((roleName: string | null) => {
        if (roleName === 'admin') return '/dashboard/admin'
        if (roleName === 'mentor') return '/dashboard/mentor'
        if (roleName === 'mentee') return '/dashboard/mentee'
        return '/onboarding'
    }, [])

    const getDefaultRedirectPath = useCallback(() => {
        if (!cachedRoles.role) return '/onboarding'
        return getRoleDashboardPath(cachedRoles.role)
    }, [cachedRoles.role, getRoleDashboardPath])

    const needsRoleSelection = useCallback(() => {
        if (!user) return false
        return !cachedRoles.role || cachedRoles.roles.length === 0
    }, [user, cachedRoles.role, cachedRoles.roles])

    const selectRole = useCallback(async (roleName: string) => {
        try {
            if (!user) throw new Error('No user')
            setLoading(true)
            const response = await fetch('/api/profile/role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ role: roleName })
            })
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}))
                throw new Error(errData.error || 'Failed to set role')
            }
            const updatedProfile = await fetchProfile()
            setProfile(updatedProfile)
            return { success: true }
        } catch (err: any) { 
            return { success: false, error: err.message } 
        } finally { 
            setLoading(false) 
        }
    }, [user, fetchProfile])

    useEffect(() => {
        let mounted = true
        const initialize = async () => {
            const { data: { session: initialSession } } = await supabase.auth.getSession()
            if (initialSession && mounted) {
                setSession(initialSession); setUser(initialSession.user)
                const userProfile = await fetchProfile()
                if (mounted) { setProfile(userProfile); setIsInitializing(false) }
            } else { if (mounted) setIsInitializing(false) }
        }
        initialize()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (event === 'SIGNED_OUT') {
                if (mounted) {
                    setSession(null); setUser(null); setProfile(null)
                    setCachedRoles(EMPTY_ROLES)
                    setIsInitializing(false)
                }
            } else if (newSession) {
                if (mounted) { setSession(newSession); setUser(newSession.user) }
                const timeoutId = setTimeout(() => { if (mounted) setIsInitializing(false) }, 4000)
                const userProfile = await fetchProfile()
                clearTimeout(timeoutId)
                if (mounted) { setProfile(userProfile); setIsInitializing(false) }
            }
        })
        return () => { mounted = false; subscription.unsubscribe() }
    }, [supabase, fetchProfile])

    const value = useMemo(() => ({
        user,
        session,
        profile,
        role: cachedRoles.role,
        claims: session?.user?.app_metadata || {},
        loading: loading || isInitializing,
        isInitializing,
        isAuthenticated: !!user && !isInitializing,
        isAdmin: cachedRoles.admin,
        isMentor: cachedRoles.mentor,
        isMentee: cachedRoles.mentee,
        isVolunteer: cachedRoles.mentor || cachedRoles.moderator,
        isModerator: cachedRoles.moderator,
        isVerified: cachedRoles.isVerified,
        isPending: cachedRoles.isPending,
        cachedRoles,
        signIn,
        signUp,
        signInWithProvider,
        signOut,
        updateProfile: async (data: any) => {
            try {
                if (!user) throw new Error('No user')
                const res = await fetch('/api/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(data)
                })
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}))
                    throw new Error(errData.error || 'Erro ao atualizar perfil')
                }
                const updatedProfile = await fetchProfile()
                setProfile(updatedProfile)
                return { success: true }
            } catch (err: any) { return { success: false, error: err.message } }
        },
        handleAuthError: (error: any) => {
            const message = error?.message || 'Ocorreu um erro inesperado'
            if (message.includes('Invalid login credentials')) return 'E-mail ou senha inválidos'
            if (message.includes('Email not confirmed')) return 'E-mail não confirmado'
            return message
        },
        getDefaultRedirectPath,
        getRoleDashboardPath,
        selectRole,
        hasRole,
        hasAnyRole: (roles: string[]) => hasRole(roles),
        hasPermission,
        hasAnyPermission,
        needsRoleSelection,
        refreshProfile: async () => {
            if (user) {
                const newProfile = await fetchProfile()
                setProfile(newProfile)
            }
        }
    }), [user, session, profile, loading, isInitializing, cachedRoles, signIn, signUp, signInWithProvider, signOut, getDefaultRedirectPath, getRoleDashboardPath, selectRole, hasRole, hasPermission, hasAnyPermission, needsRoleSelection, fetchProfile, supabase])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider')
    return context
}
