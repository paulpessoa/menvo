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

export type UserRoleType = "pending" | "mentee" | "mentor" | "admin" | "volunteer" | "moderator"

export type Permission =
    | "view_mentors"
    | "book_sessions"
    | "provide_mentorship"
    | "manage_availability"
    | "admin_users"
    | "admin_verifications"
    | "admin_system"
    | "validate_activities"
    | "moderate_content"

export interface AuthContextType {
    // State
    user: User | null
    profile: Profile | null
    role: 'mentor' | 'mentee' | 'admin' | null
    isVerified: boolean
    isAuthenticated: boolean
    loading: boolean

    // Auth operations
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>
    signInWithProvider: (provider: 'google' | 'linkedin') => Promise<void>
    signOut: () => Promise<void>
    selectRole: (role: 'mentor' | 'mentee') => Promise<void>
    refreshProfile: () => Promise<void>
    getRoleDashboardPath: (userRole: string | null) => string

    // Permission helpers
    hasPermission: (permission: Permission) => boolean
    hasRole: (roleToCheck: UserRoleType) => boolean
    hasAnyPermission: (perms: Permission[]) => boolean
    isAdmin: boolean
    isMentor: boolean
    isMentee: boolean
    canAdminSystem: boolean
    canAdminUsers: boolean
    canAdminVerifications: boolean
    canValidateActivities: boolean
    canViewReports: boolean

    // Additional helpers
    hasAnyRole: (roles: string[]) => boolean
    needsRoleSelection: () => boolean
    needsVerification: () => boolean
    canAccessMentorFeatures: () => boolean
    canAccessAdminFeatures: () => boolean
    handleAuthError: (error: any) => string
    isInitializing: boolean
    isReady: boolean
    getDefaultRedirectPath: () => string
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
            console.log('🔄 Fetching profile for user:', userId)

            // Get profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (profileError) {
                console.error('❌ Error fetching profile:', profileError)
                return
            }

            console.log('✅ Profile fetched:', profileData)
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
                console.log('ℹ️  No role found for user (expected for new users):', roleError.message)
                setRole(null)
                return
            }

            const roleName = roleData?.roles?.name as 'mentor' | 'mentee' | 'admin' | null
            console.log('✅ User role found:', roleName)
            setRole(roleName)

        } catch (error) {
            console.error('❌ Error in fetchUserProfile:', error)
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
        // Import the fixed OAuth function
        const { signInWithOAuthProvider } = await import('./oauth-provider-fixes')

        const result = await signInWithOAuthProvider(supabase, provider, {
            redirectTo: `${window.location.origin}/auth/callback`
        })

        if (result.error) {
            throw result.error
        }
    }, [supabase])

    // Sign out
    const signOut = useCallback(async () => {
        try {
            console.log('🔄 Iniciando logout...')

            // Clear local state first
            setUser(null)
            setProfile(null)
            setRole(null)

            // Sign out from Supabase
            const { error } = await supabase.auth.signOut()

            if (error) {
                console.error('❌ Erro no logout:', error)
                throw error
            }

            console.log('✅ Logout realizado com sucesso')

            // Force redirect to home page
            if (typeof window !== 'undefined') {
                window.location.href = '/'
            }
        } catch (error) {
            console.error('❌ Erro durante logout:', error)
            // Even if there's an error, clear local state and redirect
            setUser(null)
            setProfile(null)
            setRole(null)

            if (typeof window !== 'undefined') {
                window.location.href = '/'
            }

            throw error
        }
    }, [supabase])

    // Select role (mentor or mentee)
    const selectRole = useCallback(async (selectedRole: 'mentor' | 'mentee') => {
        if (!user?.id) {
            throw new Error('User not authenticated')
        }

        console.log('🔄 Selecting role:', selectedRole, 'for user:', user.id)

        try {
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
                console.error('❌ API error selecting role:', errorData)
                throw new Error(errorData.error || 'Failed to select role')
            }

            const responseData = await response.json()
            console.log('✅ Role selection API response:', responseData)

            // Update local state immediately
            setRole(selectedRole)

            // Refresh profile to get updated data
            await fetchUserProfile(user.id)

            console.log('✅ Role selection completed successfully')
        } catch (error) {
            console.error('❌ Error in selectRole:', error)
            throw error
        }
    }, [user?.id, fetchUserProfile])

    // Get role-based dashboard path
    const getRoleDashboardPath = useCallback((userRole: string | null) => {
        switch (userRole) {
            case 'admin':
                return '/dashboard/admin'
            case 'mentor':
                return '/dashboard/mentor'
            case 'mentee':
                return '/dashboard/mentee'
            default:
                return '/dashboard'
        }
    }, [])

    // Permission checking functions
    const hasPermission = useCallback((permission: Permission): boolean => {
        if (loading) return false

        // Simple role-based permissions for MVP
        switch (role) {
            case 'admin':
                return true // Admin has all permissions
            case 'mentor':
                return ['view_mentors', 'provide_mentorship', 'manage_availability'].includes(permission)
            case 'mentee':
                return ['view_mentors', 'book_sessions'].includes(permission)
            default:
                return false
        }
    }, [role, loading])

    const hasRole = useCallback((roleToCheck: UserRoleType): boolean => {
        if (loading) return false
        return role === roleToCheck
    }, [role, loading])

    const hasAnyPermission = useCallback((perms: Permission[]): boolean => {
        if (loading) return false
        return perms.some((p) => hasPermission(p))
    }, [hasPermission, loading])

    // Helper computed values
    const isAdmin = hasRole("admin")
    const isMentor = hasRole("mentor")
    const isMentee = hasRole("mentee")

    const canAdminSystem = isAdmin
    const canAdminUsers = isAdmin
    const canAdminVerifications = isAdmin
    const canValidateActivities = isAdmin
    const canViewReports = isAdmin

    // Additional helper functions
    const hasAnyRole = useCallback((roles: string[]): boolean => {
        return roles.includes(role || '')
    }, [role])

    const needsRoleSelection = useCallback((): boolean => {
        return !!user && !role
    }, [user, role])

    const needsVerification = useCallback((): boolean => {
        return role === 'mentor' && !profile?.verified
    }, [role, profile?.verified])

    const canAccessMentorFeatures = useCallback((): boolean => {
        return role === 'mentor' && !!profile?.verified
    }, [role, profile?.verified])

    const canAccessAdminFeatures = useCallback((): boolean => {
        return role === 'admin'
    }, [role])

    const handleAuthError = useCallback((error: any): string => {
        console.error('Auth error:', error)

        // Common error messages mapping
        const errorMessages: Record<string, string> = {
            'Email not confirmed': 'Por favor, confirme seu email antes de fazer login.',
            'Invalid login credentials': 'Email ou senha incorretos.',
            'Email link is invalid or has expired': 'Link expirado. Solicite um novo email.',
            'Email address already confirmed': 'Email já confirmado. Faça login normalmente.',
            'Password recovery requires email confirmation': 'Confirme seu email antes de recuperar a senha.',
            'Email change requires confirmation': 'Verifique seu email para confirmar a alteração.'
        }

        return errorMessages[error.message] || 'Erro inesperado. Tente novamente.'
    }, [])

    const isInitializing = loading
    const isReady = !loading
    const getDefaultRedirectPath = useCallback(() => {
        return getRoleDashboardPath(role)
    }, [role, getRoleDashboardPath])

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
        isAuthenticated: !!user && !loading,
        loading,

        // Operations
        signIn,
        signUp,
        signInWithProvider,
        signOut,
        selectRole,
        refreshProfile,
        getRoleDashboardPath,

        // Permissions
        hasPermission,
        hasRole,
        hasAnyPermission,
        isAdmin,
        isMentor,
        isMentee,
        canAdminSystem,
        canAdminUsers,
        canAdminVerifications,
        canValidateActivities,
        canViewReports,

        // Additional helpers
        hasAnyRole,
        needsRoleSelection,
        needsVerification,
        canAccessMentorFeatures,
        canAccessAdminFeatures,
        handleAuthError,
        isInitializing,
        isReady,
        getDefaultRedirectPath,
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