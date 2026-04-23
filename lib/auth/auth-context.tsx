"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/utils/supabase/client'
import { User, Session } from '@supabase/supabase-js'
import type { UserProfile, UserRole } from '@/lib/types/models/user'

export interface AuthContextType {
    user: User | null
    session: Session | null
    profile: UserProfile | null
    role: 'admin' | 'mentor' | 'mentee' | null
    isAuthenticated: boolean
    isInitializing: boolean
    loading: boolean
    isVerified: boolean
    isAdmin: boolean
    isMentor: boolean
    isMentee: boolean
    isVolunteer: boolean
    isModerator: boolean
    isPending: boolean
    claims: any
    hasRole: (role: string) => boolean
    hasPermission: (permission: string) => boolean
    hasAnyPermission: (permissions: string[]) => boolean
    hasAnyRole: (roles: string[]) => boolean
    needsRoleSelection: () => boolean
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>
    signInWithProvider: (provider: 'google' | 'linkedin') => Promise<void>
    selectRole: (roleName: 'mentor' | 'mentee') => Promise<void>
    getRoleDashboardPath: (roleName?: string) => string
    refreshProfile: () => Promise<void>
    signOut: () => Promise<void>
    getDefaultRedirectPath: () => string
    handleAuthError: (error: any) => string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isInitializing, setIsInitializing] = useState(true)
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const claims = useMemo(() => {
        if (!session?.user) return null
        return {
            role: session.user.app_metadata?.role || null,
            permissions: (session.user.app_metadata?.permissions as string[]) || [],
            status: session.user.app_metadata?.status || null
        }
    }, [session])

    const handleAuthError = useCallback((error: any): string => {
        if (!error) return ""
        const message = error.message || error.error_description || error.toString()
        if (message.includes("Invalid login credentials")) return "Email ou senha incorretos."
        if (message.includes("User not found")) return "Usuário não encontrado."
        if (message.includes("Email not confirmed")) return "Confirme seu email antes de fazer login."
        if (message.includes("Password is too short")) return "A senha deve ter pelo menos 6 caracteres."
        if (message.includes("User already registered")) return "Este email já está cadastrado."
        if (message.includes("Rate limit exceeded")) return "Muitas tentativas. Tente novamente mais tarde."
        return message
    }, [])

    const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
        try {
            const { data, error } = await (supabase
                .from('profiles')
                .select(`
                    *,
                    user_roles (
                        roles (
                            name
                        )
                    )
                `)
                .eq('id', userId)
                .single() as any)

            if (error || !data) return null

            const rawRoles = (data.user_roles as any[])?.map((ur: any) => ur.roles?.name as UserRole).filter(Boolean) || []
            
            return {
                ...data,
                roles: rawRoles
            } as UserProfile
        } catch (error) {
            return null
        }
    }, [supabase])

    const refreshProfile = useCallback(async () => {
        if (!user) return
        setLoading(true)
        const updatedProfile = await fetchProfile(user.id)
        setProfile(updatedProfile)
        setLoading(false)
    }, [user, fetchProfile])

    useEffect(() => {
        let mounted = true
        
        const initAuth = async () => {
            try {
                const { data: { session: currentSession } } = await supabase.auth.getSession()
                if (!mounted) return
                
                setSession(currentSession)
                setUser(currentSession?.user ?? null)

                if (currentSession?.user) {
                    const userProfile = await fetchProfile(currentSession.user.id)
                    if (mounted) setProfile(userProfile)
                }
            } catch (err) {
                // Ignore initialization errors
            } finally {
                if (mounted) setIsInitializing(false)
            }
        }

        initAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (!mounted) return

            if (event === 'SIGNED_OUT') {
                setUser(null)
                setSession(null)
                setProfile(null)
                setIsInitializing(false)
                return
            }

            if (newSession) {
                setSession(newSession)
                setUser(newSession.user)
                try {
                    const userProfile = await fetchProfile(newSession.user.id)
                    if (mounted) setProfile(userProfile)
                } catch (err) {
                    console.error('[Auth] Error fetching profile during state change:', err)
                } finally {
                    if (mounted) setIsInitializing(false)
                }
            } else {
                setIsInitializing(false)
            }
        })

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [supabase, fetchProfile])

    const signIn = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
    }, [supabase])

    const signUp = useCallback(async (email: string, password: string, firstName: string, lastName: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    full_name: `${firstName} ${lastName}`
                },
                emailRedirectTo: `${window.location.origin}/auth/callback`
            }
        })
        if (error) throw error
    }, [supabase])

    const signInWithProvider = useCallback(async (provider: 'google' | 'linkedin') => {
        const supabaseProvider = provider === 'linkedin' ? 'linkedin_oidc' : provider
        const { error } = await supabase.auth.signInWithOAuth({
            provider: supabaseProvider as any,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: provider === 'google' ? {
                    access_type: 'offline',
                    prompt: 'consent'
                } : undefined
            },
        })
        if (error) throw error
    }, [supabase])

    const selectRole = useCallback(async (roleName: 'mentor' | 'mentee') => {
        if (!user) throw new Error('User not authenticated')
        
        const { data: roleData, error: roleError } = await supabase
            .from('roles')
            .select('id')
            .eq('name', roleName)
            .single()
            
        if (roleError || !roleData) throw roleError || new Error('Role not found')
        
        const { error: insertError } = await (supabase
            .from('user_roles') as any)
            .insert({ user_id: user.id, role_id: (roleData as any).id })
            
        if (insertError) throw insertError
        await refreshProfile()
    }, [user, supabase, refreshProfile])

    const getRoleDashboardPath = useCallback((roleName?: string) => {
        const r = roleName || (profile?.roles?.[0] as string)
        if (r === 'admin') return '/dashboard/admin'
        if (r === 'mentor') return '/dashboard/mentor'
        if (r === 'mentee') return '/dashboard/mentee'
        return '/dashboard'
    }, [profile])

    const isAdmin = useMemo(() => (claims?.role === 'admin') || (profile?.roles?.includes('admin' as UserRole) ?? false), [claims, profile])
    const isMentor = useMemo(() => !isAdmin && ((claims?.role === 'mentor') || (profile?.roles?.includes('mentor' as UserRole) ?? false)), [claims, profile, isAdmin])
    const isMentee = useMemo(() => !isAdmin && ((claims?.role === 'mentee') || (profile?.roles?.includes('mentee' as UserRole) ?? false)), [claims, profile, isAdmin])
    const isVolunteer = useMemo(() => (claims?.role === 'volunteer') || (profile?.roles?.includes('volunteer' as UserRole) ?? false), [claims, profile])
    const isModerator = useMemo(() => (claims?.role === 'moderator') || (profile?.roles?.includes('moderator' as UserRole) ?? false), [claims, profile])
    const isPending = useMemo(() => (profile?.roles?.length ?? 0) === 0, [profile])

    const hasRole = useCallback((r: string) => profile?.roles?.includes(r as UserRole) ?? false, [profile])
    const hasPermission = useCallback((p: string) => (claims?.permissions as string[])?.includes(p) ?? false, [claims])
    const hasAnyPermission = useCallback((ps: string[]) => ps.some(p => hasPermission(p)), [hasPermission])
    const hasAnyRole = useCallback((rs: string[]) => profile?.roles?.some(r => rs.includes(r as UserRole)) ?? false, [profile])

    const effectiveRole = useMemo((): 'admin' | 'mentor' | 'mentee' | null => {
        if (!profile?.roles) return null
        if (profile.roles.includes('admin' as UserRole)) return 'admin'
        if (profile.roles.includes('mentor' as UserRole)) return 'mentor'
        if (profile.roles.includes('mentee' as UserRole)) return 'mentee'
        return null
    }, [profile])

    const needsRoleSelection = useCallback(() => {
        if (isInitializing || !user || isAdmin) return false
        return !!(profile && (profile.roles?.length ?? 0) === 0)
    }, [profile, isInitializing, user, isAdmin])

    const getDefaultRedirectPath = useCallback(() => {
        if (!profile) return '/dashboard'
        if (isAdmin) return '/dashboard/admin'
        if (isMentor) return '/dashboard/mentor'
        if (isMentee) return '/dashboard/mentee'
        return '/dashboard'
    }, [profile, isAdmin, isMentor, isMentee])

    const signOut = async () => {
        setLoading(true)
        try {
            await supabase.auth.signOut({ scope: 'local' })
        } catch (err) {
            // Ignora erro de signOut — o cookie já foi invalidado client-side
            console.warn('[Auth] signOut error (non-critical):', err)
        } finally {
            setLoading(false)
            // Usa replace() para não deixar a página autenticada no histórico,
            // evitando o loop loading ← back ← middleware ← redirect
            window.location.replace('/')
        }
    }

    const value = useMemo(() => ({
        user, session, profile, role: effectiveRole, isAuthenticated: !!user, isInitializing, loading: loading || isInitializing,
        isVerified: profile?.verified ?? false, isAdmin, isMentor, isMentee, isVolunteer, isModerator, isPending,
        claims, hasRole, hasPermission, hasAnyPermission, hasAnyRole, needsRoleSelection, signIn, signUp, signInWithProvider,
        selectRole, getRoleDashboardPath, refreshProfile, signOut, getDefaultRedirectPath, handleAuthError
    }), [user, session, profile, isInitializing, loading, effectiveRole, isAdmin, isMentor, isMentee, isVolunteer, isModerator, isPending, claims, hasRole, hasPermission, hasAnyPermission, hasAnyRole, needsRoleSelection, signIn, signUp, signInWithProvider, selectRole, getRoleDashboardPath, refreshProfile, getDefaultRedirectPath, handleAuthError])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider')
    return context
}
