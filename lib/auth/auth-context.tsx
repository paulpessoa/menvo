"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
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
    role: string | null
    isAuthenticated: boolean
    isInitializing: boolean
    loading: boolean
    isVerified: boolean
    isAdmin: () => boolean
    isMentor: () => boolean
    isMentee: () => boolean
    hasAnyRole: (roles: string[]) => boolean
    needsRoleSelection: () => boolean
    refreshProfile: () => Promise<void>
    signOut: () => Promise<void>
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

            const roles = (data.user_roles as any)?.map((ur: any) => ur.roles?.name) || []
            
            return {
                ...data,
                roles
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
            const { data: { session: currentSession } } = await supabase.auth.getSession()
            setSession(currentSession)
            const currentUser = currentSession?.user ?? null
            setUser(currentUser)

            if (currentUser) {
                const userProfile = await fetchProfile(currentUser.id)
                setProfile(userProfile)
            }
            
            setIsInitializing(false)
        }

        initAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            setSession(newSession)
            const currentUser = newSession?.user ?? null
            setUser(currentUser)

            if (currentUser) {
                const userProfile = await fetchProfile(currentUser.id)
                setProfile(userProfile)
            } else {
                setProfile(null)
            }
        })

        return () => subscription.unsubscribe()
    }, [supabase, fetchProfile])

    const isAdmin = () => profile?.roles?.includes('admin') ?? false
    const isMentor = () => profile?.roles?.includes('mentor') ?? false
    const isMentee = () => profile?.roles?.includes('mentee') ?? false
    const hasAnyRole = (roles: string[]) => profile?.roles?.some(r => roles.includes(r)) ?? false
    const needsRoleSelection = () => (profile?.roles?.length ?? 0) === 0

    const signOut = async () => {
        await supabase.auth.signOut()
        window.location.href = '/'
    }

    const value = {
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
        refreshProfile,
        signOut
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
