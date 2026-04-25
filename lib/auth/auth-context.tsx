
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

    const [cachedRoles, setCachedRoles] = useState<{admin: boolean, mentor: boolean, mentee: boolean, moderator: boolean, role: string | null, isVerified: boolean, roles: string[], isPending: boolean}>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('menvo_roles')
            return saved ? JSON.parse(saved) : { admin: false, mentor: false, mentee: true, moderator: false, role: null, isVerified: false, roles: [], isPending: false }
        }
        return { admin: false, mentor: false, mentee: true, moderator: false, role: null, isVerified: false, roles: [], isPending: false }
    })

    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*, user_roles(roles(name))')
                .eq('id', userId)
                .single()

            if (error) throw error

            const roleNames = (data as any)?.user_roles?.map((ur: any) => ur.roles?.name) || []
            
            // Prioridade absoluta: Admin > Mentor > Mentee
            let primaryRole = 'mentee'
            if (roleNames.includes('admin')) primaryRole = 'admin'
            else if (roleNames.includes('mentor')) primaryRole = 'mentor'
            else if (roleNames.includes('mentee')) primaryRole = 'mentee'
            
            const roles = {
                admin: roleNames.includes('admin'),
                mentor: roleNames.includes('mentor'),
                mentee: roleNames.includes('mentee') || roleNames.length === 0,
                moderator: roleNames.includes('moderator'),
                role: primaryRole,
                isVerified: (data as any)?.is_verified || false,
                isPending: (data as any)?.verification_status === 'pending',
                roles: roleNames
            }
            
            if (typeof window !== 'undefined') {
                localStorage.setItem('menvo_roles', JSON.stringify(roles))
            }
            setCachedRoles(roles)
            return data
        } catch (err) {
            console.error('[Auth] Error fetching profile:', err)
            return null
        }
    }, [supabase])

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
            await supabase.auth.signOut()
            if (typeof window !== 'undefined') {
                localStorage.removeItem('menvo_roles')
                window.location.href = '/'
            }
        } catch (error) { toast.error('Erro ao sair da conta') } finally { setLoading(false) }
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
        return '/dashboard/mentee'
    }, [])

    const getDefaultRedirectPath = useCallback(() => {
        if (!cachedRoles.role) return '/profile'
        return getRoleDashboardPath(cachedRoles.role)
    }, [cachedRoles.role, getRoleDashboardPath])

    const selectRole = useCallback(async (roleName: string) => {
        try {
            if (!user) throw new Error('No user')
            setLoading(true)
            const response = await fetch('/api/profile/role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: roleName })
            })
            if (!response.ok) throw new Error('Failed to set role')
            await fetchProfile(user.id).then(setProfile)
            return { success: true }
        } catch (err: any) { return { success: false, error: err.message } } finally { setLoading(false) }
    }, [user, fetchProfile])

    useEffect(() => {
        let mounted = true
        const initialize = async () => {
            const { data: { session: initialSession } } = await supabase.auth.getSession()
            if (initialSession && mounted) {
                setSession(initialSession); setUser(initialSession.user)
                const userProfile = await fetchProfile(initialSession.user.id)
                if (mounted) { setProfile(userProfile); setIsInitializing(false) }
            } else { if (mounted) setIsInitializing(false) }
        }
        initialize()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (event === 'SIGNED_OUT') {
                if (mounted) {
                    setSession(null); setUser(null); setProfile(null)
                    setCachedRoles({ admin: false, mentor: false, mentee: true, moderator: false, role: null, isVerified: false, roles: [], isPending: false })
                    setIsInitializing(false)
                }
            } else if (newSession) {
                if (mounted) { setSession(newSession); setUser(newSession.user) }
                const timeoutId = setTimeout(() => { if (mounted) setIsInitializing(false) }, 4000)
                const userProfile = await fetchProfile(newSession.user.id)
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
                const { error } = await (supabase.from('profiles') as any).update(data).eq('id', user.id)
                if (error) throw error
                const newProfile = await fetchProfile(user.id)
                setProfile(newProfile)
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
        needsRoleSelection: () => false,
        refreshProfile: async () => {
            if (user) {
                const newProfile = await fetchProfile(user.id)
                setProfile(newProfile)
            }
        }
    }), [user, session, profile, loading, isInitializing, cachedRoles, signIn, signUp, signInWithProvider, signOut, getDefaultRedirectPath, getRoleDashboardPath, selectRole, hasRole, hasPermission, hasAnyPermission, fetchProfile, supabase])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider')
    return context
}
