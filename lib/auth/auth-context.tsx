"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User, Session } from '@supabase/supabase-js'

interface UserProfile {
    id: string
    full_name: string | null
    avatar_url: string | null
    verified: boolean
    roles: string[]
    average_rating: number
    total_reviews: number
    verification_status: string
    verification_notes: string | null
    is_public: boolean
}

interface AuthContextType {
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
    hasAnyRole: (roles: string[]) => boolean
    needsRoleSelection: () => boolean
    signIn: (email: string, password: string) => Promise<void>
    signInWithProvider: (provider: 'google' | 'linkedin') => Promise<void>
    refreshProfile: () => Promise<void>
    signOut: () => Promise<void>
    getDefaultRedirectPath: () => string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isInitializing, setIsInitializing] = useState(true)
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    id,
                    full_name,
                    avatar_url,
                    verified,
                    verification_status,
                    verification_notes,
                    average_rating,
                    total_reviews,
                    is_public,
                    user_roles (
                        roles (
                            name
                        )
                    )
                `)
                .eq('id', userId)
                .single()

            if (error) return null

            const rawRoles = (data.user_roles as any)?.map((ur: any) => ur.roles?.name).filter(Boolean) || []
            
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
        const initAuth = async () => {
            try {
                const { data: { session: currentSession } } = await supabase.auth.getSession()
                setSession(currentSession)
                const currentUser = currentSession?.user ?? null
                setUser(currentUser)

                if (currentUser) {
                    const userProfile = await fetchProfile(currentUser.id)
                    setProfile(userProfile)
                }
            } catch (err) {
                console.error('Auth initialization error:', err)
            } finally {
                setIsInitializing(false)
            }
        }

        initAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (event === 'SIGNED_OUT') {
                setUser(null)
                setSession(null)
                setProfile(null)
                return
            }

            setSession(newSession)
            const currentUser = newSession?.user ?? null
            setUser(currentUser)

            if (currentUser && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
                const userProfile = await fetchProfile(currentUser.id)
                setProfile(userProfile)
            }
        })

        return () => subscription.unsubscribe()
    }, [supabase, fetchProfile])

    const signIn = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
    }, [supabase])

    const signInWithProvider = useCallback(async (provider: 'google' | 'linkedin') => {
        const supabaseProvider = provider === 'linkedin' ? 'linkedin_oidc' : provider
        const { error } = await supabase.auth.signInWithOAuth({
            provider: supabaseProvider as any,
            options: {
                redirectTo: `${window.location.origin}/callback`, // Aponta para a raiz limpa
            },
        })
        if (error) throw error
    }, [supabase])

    const isAdmin = useMemo(() => profile?.roles?.includes('admin') ?? false, [profile])
    const isMentor = useMemo(() => {
        if (isAdmin) return false
        return profile?.roles?.includes('mentor') ?? false
    }, [profile, isAdmin])
    const isMentee = useMemo(() => {
        if (isAdmin) return false
        return profile?.roles?.includes('mentee') ?? false
    }, [profile, isAdmin])

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
        if (!profile || isInitializing) return false
        if (isAdmin) return false
        return (profile.roles?.length ?? 0) === 0
    }, [profile, isInitializing, isAdmin])

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
        hasAnyRole,
        needsRoleSelection,
        signIn,
        signInWithProvider,
        refreshProfile,
        signOut,
        getDefaultRedirectPath
    }), [user, session, profile, isInitializing, loading, effectiveRole, isAdmin, isMentor, isMentee, hasAnyRole, needsRoleSelection, signIn, signInWithProvider, refreshProfile, getDefaultRedirectPath])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
