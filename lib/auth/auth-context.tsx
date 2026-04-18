"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

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
    role: string | null
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
    const router = useRouter()

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

            if (error) {
                console.error('Error fetching profile:', error)
                return null
            }

            const roles = (data.user_roles as any)?.map((ur: any) => ur.roles?.name).filter(Boolean) || []
            
            return {
                ...data,
                roles
            } as UserProfile
        } catch (error) {
            console.error('Unexpected error fetching profile:', error)
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

            if (currentUser && event !== 'INITIAL_SESSION') {
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
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
        if (error) throw error
    }, [supabase])

    // Flags de conveniência computadas
    const isAdmin = useMemo(() => profile?.roles?.includes('admin') ?? false, [profile])
    const isMentor = useMemo(() => profile?.roles?.includes('mentor') ?? false, [profile])
    const isMentee = useMemo(() => profile?.roles?.includes('mentee') ?? false, [profile])

    const hasAnyRole = useCallback((roles: string[]) => profile?.roles?.some(r => roles.includes(r)) ?? false, [profile])
    const needsRoleSelection = useCallback(() => (profile?.roles?.length ?? 0) === 0, [profile])

    const getDefaultRedirectPath = useCallback(() => {
        if (!profile) return '/dashboard'
        if (profile.roles.includes('admin')) return '/admin'
        if (profile.roles.includes('mentor')) return '/dashboard/mentor'
        return '/dashboard/mentee'
    }, [profile])

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
        role: profile?.roles?.[0] || null,
        isAuthenticated: !!user,
        isInitializing,
        loading,
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
    }), [user, session, profile, isInitializing, loading, isAdmin, isMentor, isMentee, hasAnyRole, needsRoleSelection, signIn, signInWithProvider, refreshProfile, getDefaultRedirectPath])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
