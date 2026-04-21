"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/utils/supabase/client'
import { User, Session } from '@supabase/supabase-js'
import { debugLog } from '@/lib/debug-logger'

export interface UserProfile {
    id: string
    full_name: string | null
    first_name?: string | null
    last_name?: string | null
    avatar_url: string | null
    verified: boolean
    roles: string[]
    average_rating: number
    total_reviews: number
    verification_status: string
    verification_notes: string | null
    is_public: boolean
    slug?: string | null
    job_title?: string | null
    company?: string | null
    location?: string | null
    city?: string | null
    state?: string | null
    country?: string | null
    timezone?: string | null
    bio?: string | null
    languages?: string[] | null
    mentorship_topics?: string[] | null
    inclusive_tags?: string[] | null
    expertise_areas?: string[] | null
    experience_years?: number | null
}

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
    selectRole: (role: 'mentor' | 'mentee') => Promise<void>
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
        // Supabase stores custom claims in app_metadata
        return {
            role: session.user.app_metadata?.role || null,
            permissions: session.user.app_metadata?.permissions || [],
            status: session.user.app_metadata?.status || null
        }
    }, [session])

    const handleAuthError = useCallback((error: any): string => {
        if (!error) return ""
        
        const message = error.message || error.error_description || error.toString()
        
        // Mapeamento de erros comuns do Supabase Auth para mensagens amigáveis
        if (message.includes("Invalid login credentials")) {
            return "Email ou senha incorretos."
        }
        if (message.includes("User not found")) {
            return "Usuário não encontrado."
        }
        if (message.includes("Email not confirmed")) {
            return "Por favor, confirme seu email antes de fazer login."
        }
        if (message.includes("Password is too short")) {
            return "A senha deve ter pelo menos 6 caracteres."
        }
        if (message.includes("User already registered")) {
            return "Este email já está cadastrado."
        }
        if (message.includes("Rate limit exceeded")) {
            return "Muitas tentativas. Tente novamente mais tarde."
        }
        
        return message
    }, [])

    const fetchProfile = useCallback(async (userId: string) => {
        try {
            console.log(`[AUTH] Buscando perfil para o usuário: ${userId}...`)
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    id,
                    full_name,
                    first_name,
                    last_name,
                    avatar_url,
                    verified,
                    slug,
                    bio,
                    expertise_areas,
                    user_roles (
                        roles (
                            name
                        )
                    )
                `)
                .eq('id', userId)
                .single()

            if (error) {
                console.error(`[AUTH] Erro ao buscar perfil:`, error.message)
                debugLog(`Error fetching profile for ${userId}`, { error: error.message }, 'error')
                return null
            }

            debugLog(`Raw profile data for ${userId}`, { 
                hasData: !!data,
                user_roles: data?.user_roles 
            }, 'debug')

            // Robust role extraction
            let rawRoles: string[] = []
            if (data?.user_roles) {
                const userRolesData = Array.isArray(data.user_roles) ? data.user_roles : [data.user_roles]
                rawRoles = userRolesData
                    .map((ur: any) => ur.roles?.name)
                    .filter(Boolean)
            }
            
            console.log(`[AUTH] Perfil carregado com sucesso. Roles detectadas:`, rawRoles)
            
            debugLog(`Detected roles for ${userId}`, { rawRoles }, 'info')

            return {
                ...data,
                roles: rawRoles
            } as UserProfile
        } catch (error) {
            console.error(`[AUTH] Erro inesperado no fetchProfile:`, error)
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
        
        const timeout = setTimeout(() => {
            if (mounted && isInitializing) {
                setIsInitializing(false)
            }
        }, 5000)

        const initAuth = async () => {
            try {
                const { data: { session: currentSession } } = await supabase.auth.getSession()
                if (!mounted) return
                
                setSession(currentSession)
                setUser(currentSession?.user ?? null)

                if (currentSession?.user) {
                    console.log(`[AUTH] Usuário logado detectado: ${currentSession.user.email} (ID: ${currentSession.user.id})`)
                    const userProfile = await fetchProfile(currentSession.user.id)
                    if (mounted) setProfile(userProfile)
                }
            } catch (err) {
                console.error('Auth initialization error:', err)
            } finally {
                if (mounted) {
                    setIsInitializing(false)
                    clearTimeout(timeout)
                }
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
                
                fetchProfile(newSession.user.id).then(userProfile => {
                    if (mounted) {
                        setProfile(userProfile)
                        setIsInitializing(false)
                    }
                })
            } else {
                setIsInitializing(false)
            }
        })

        return () => {
            mounted = false
            clearTimeout(timeout)
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
                emailRedirectTo: `${window.location.origin}/api/auth/callback`
            }
        })
        if (error) throw error
    }, [supabase])

    const signInWithProvider = useCallback(async (provider: 'google' | 'linkedin') => {
        const supabaseProvider = provider === 'linkedin' ? 'linkedin_oidc' : provider
        const { error } = await supabase.auth.signInWithOAuth({
            provider: supabaseProvider as any,
            options: {
                redirectTo: `${window.location.origin}/api/auth/callback`,
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
        
        // 1. Buscar o ID da role
        const { data: roleData, error: roleError } = await supabase
            .from('roles')
            .select('id')
            .eq('name', roleName)
            .single()
        
        if (roleError) throw roleError

        // 2. Inserir na user_roles
        const { error: insertError } = await supabase
            .from('user_roles')
            .insert({
                user_id: user.id,
                role_id: roleData.id
            })
        
        if (insertError) throw insertError

        await refreshProfile()
    }, [user, supabase, refreshProfile])

    const getRoleDashboardPath = useCallback((roleName?: string) => {
        const r = roleName || profile?.roles?.[0]
        if (r === 'admin') return '/admin'
        if (r === 'mentor') return '/dashboard/mentor'
        if (r === 'mentee') return '/dashboard/mentee'
        return '/dashboard'
    }, [profile])

    const isAdmin = useMemo(() => {
        return (claims?.role === 'admin') || (profile?.roles?.includes('admin') ?? false)
    }, [claims, profile])

    const isMentor = useMemo(() => {
        if (isAdmin) return false
        return (claims?.role === 'mentor') || (profile?.roles?.includes('mentor') ?? false)
    }, [claims, profile, isAdmin])

    const isMentee = useMemo(() => {
        if (isAdmin) return false
        return (claims?.role === 'mentee') || (profile?.roles?.includes('mentee') ?? false)
    }, [claims, profile, isAdmin])

    const isVolunteer = useMemo(() => {
        return (claims?.role === 'volunteer') || (profile?.roles?.includes('volunteer') ?? false)
    }, [claims, profile])

    const isModerator = useMemo(() => {
        return (claims?.role === 'moderator') || (profile?.roles?.includes('moderator') ?? false)
    }, [claims, profile])
    const isPending = useMemo(() => (profile?.roles?.length ?? 0) === 0, [profile])

    const hasRole = useCallback((role: string) => {
        return profile?.roles?.includes(role) ?? false
    }, [profile])

    const hasPermission = useCallback((permission: string) => {
        return (claims?.permissions as string[])?.includes(permission) ?? false
    }, [claims])

    const hasAnyPermission = useCallback((permissions: string[]) => {
        return permissions.some(p => hasPermission(p))
    }, [hasPermission])

    const effectiveRole = useMemo((): 'admin' | 'mentor' | 'mentee' | null => {
        if (!profile?.roles) return null
        if (profile.roles.includes('admin')) return 'admin'
        if (profile.roles.includes('mentor')) return 'mentor'
        if (profile.roles.includes('mentee')) return 'mentee'
        return null
    }, [profile])

    const hasAnyRole = useCallback((roles: string[]) => {
        if (!profile?.roles) return false
        return profile.roles.some(r => roles.includes(r))
    }, [profile])

    const needsRoleSelection = useCallback(() => {
        if (isInitializing || !user) return false
        // Se já detectamos que é admin via claims ou profile, não precisa selecionar role
        if (isAdmin) return false
        
        // Se o perfil carregou e não tem roles, precisa selecionar
        if (profile && (profile.roles?.length ?? 0) === 0) return true
        
        return false
    }, [profile, isInitializing, user, isAdmin])

    const getDefaultRedirectPath = useCallback(() => {
        if (!profile) return '/dashboard'
        if (isAdmin) return '/admin'
        if (isMentor) return '/dashboard/mentor'
        if (isMentee) return '/dashboard/mentee'
        return '/dashboard'
    }, [profile, isAdmin, isMentor, isMentee])

    const signOut = async () => {
        setLoading(true)
        try {
            await supabase.auth.signOut()
            window.location.href = '/'
        } catch (err) {
            console.error('Sign out error:', err)
        } finally {
            setLoading(false)
        }
    }

    const value = useMemo(() => ({
        user,
        session,
        profile,
        role: effectiveRole,
        isAuthenticated: !!user,
        isInitializing,
        loading: loading || isInitializing,
        isVerified: profile?.verified ?? false,
        isAdmin,
        isMentor,
        isMentee,
        isVolunteer,
        isModerator,
        isPending,
        claims,
        hasRole,
        hasPermission,
        hasAnyPermission,
        hasAnyRole,
        needsRoleSelection,
        signIn,
        signUp,
        signInWithProvider,
        selectRole,
        getRoleDashboardPath,
        refreshProfile,
        signOut,
        getDefaultRedirectPath,
        handleAuthError
    }), [user, session, profile, isInitializing, loading, effectiveRole, isAdmin, isMentor, isMentee, isVolunteer, isModerator, isPending, claims, hasRole, hasPermission, hasAnyPermission, hasAnyRole, needsRoleSelection, signIn, signUp, signInWithProvider, selectRole, getRoleDashboardPath, refreshProfile, getDefaultRedirectPath, handleAuthError])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
