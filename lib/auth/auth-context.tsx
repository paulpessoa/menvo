"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/utils/supabase/client"

// Simplified types for MVP
export interface Profile {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    full_name: string | null
    avatar_url: string | null
    slug: string | null
    verified: boolean
    created_at: string
    updated_at: string
}

export interface AuthContextType {
    // State
    user: User | null
    profile: Profile | null
    role: 'mentor' | 'mentee' | 'admin' | null
    isVerified: boolean
    loading: boolean

    // Auth operations
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>
    signInWithProvider: (provider: 'google' | 'linkedin') => Promise<void>
    signOut: () => Promise<void>
    selectRole: (role: 'mentor' | 'mentee') => Promise<void>
    refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [role, setRole] = useState<'mentor' | 'mentee' | 'admin' | null>(null)
    const [loading, setLoading] = useState(true)

    const supabase = createClient()

    // Fetch user profile and role
    const fetchUserProfile = useCallback(async (userId: string) => {
        try {
            // Get profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (profileError) {
                console.error('Error fetching profile:', profileError)
                return
            }

            setProfile(profileData)

            // Get user role
            const { data: roleData, error: roleError } = await supabase
                .from('user_roles')
                .select(`
          roles (
            name
          )
        `)
                .eq('user_id', userId)
                .single()

            if (roleError) {
                // User might not have a role yet (null is expected for new users)
                console.log('No role found for user:', roleError)
                setRole(null)
                return
            }

            const roleName = roleData?.roles?.name as 'mentor' | 'mentee' | 'admin' | null
            setRole(roleName)

        } catch (error) {
            console.error('Error in fetchUserProfile:', error)
        }
    }, [supabase])

    // Refresh profile data
    const refreshProfile = useCallback(async () => {
        if (!user?.id) return
        await fetchUserProfile(user.id)
    }, [user?.id, fetchUserProfile])

    // Sign in with email/password
    const signIn = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email: email.toLowerCase().trim(),
            password
        })

        if (error) {
            throw error
        }
    }, [supabase])

    // Sign up with email/password
    const signUp = useCallback(async (
        email: string,
        password: string,
        firstName: string,
        lastName: string
    ) => {
        const { error } = await supabase.auth.signUp({
            email: email.toLowerCase().trim(),
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    full_name: `${firstName} ${lastName}`
                }
            }
        })

        if (error) {
            throw error
        }
    }, [supabase])

    // Sign in with OAuth provider
    const signInWithProvider = useCallback(async (provider: 'google' | 'linkedin') => {
        const providerName = provider === 'linkedin' ? 'linkedin_oidc' : provider

        const { error } = await supabase.auth.signInWithOAuth({
            provider: providerName as any,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        })

        if (error) {
            throw error
        }
    }, [supabase])

    // Sign out
    const signOut = useCallback(async () => {
        const { error } = await supabase.auth.signOut()

        if (error) {
            throw error
        }

        // Clear state
        setUser(null)
        setProfile(null)
        setRole(null)
    }, [supabase])

    // Select role (mentor or mentee)
    const selectRole = useCallback(async (selectedRole: 'mentor' | 'mentee') => {
        if (!user?.id) {
            throw new Error('User not authenticated')
        }

        // Use API endpoint to avoid RLS issues
        const response = await fetch('/api/auth/select-role', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: user.id,
                role: selectedRole
            })
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to select role')
        }

        // Update local state
        setRole(selectedRole)

        // Refresh profile to get updated data
        await fetchUserProfile(user.id)
    }, [user?.id, fetchUserProfile])

    // Initialize auth state
    useEffect(() => {
        let mounted = true

        const initializeAuth = async () => {
            try {
                // Get current session
                const { data: { session } } = await supabase.auth.getSession()

                if (mounted) {
                    if (session?.user) {
                        setUser(session.user)
                        await fetchUserProfile(session.user.id)
                    }
                    setLoading(false)
                }

                // Listen for auth changes
                const { data: { subscription } } = supabase.auth.onAuthStateChange(
                    async (event, session) => {
                        if (mounted) {
                            if (session?.user) {
                                setUser(session.user)
                                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                                    await fetchUserProfile(session.user.id)
                                }
                            } else {
                                setUser(null)
                                setProfile(null)
                                setRole(null)
                            }
                            setLoading(false)
                        }
                    }
                )

                return () => {
                    subscription.unsubscribe()
                }
            } catch (error) {
                console.error('Error initializing auth:', error)
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        initializeAuth()

        return () => {
            mounted = false
        }
    }, [supabase, fetchUserProfile])

    const value: AuthContextType = {
        // State
        user,
        profile,
        role,
        isVerified: profile?.verified || false,
        loading,

        // Operations
        signIn,
        signUp,
        signInWithProvider,
        signOut,
        selectRole,
        refreshProfile
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}