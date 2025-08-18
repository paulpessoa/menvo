"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient, isSupabaseConfigured } from "@/utils/supabase/client"

// Types
export interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  full_name: string
  slug: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  role: 'pending' | 'mentee' | 'mentor' | 'admin' | 'volunteer' | 'moderator'
  status: 'pending' | 'active' | 'suspended' | 'rejected'
  verification_status: 'pending' | 'pending_validation' | 'active' | 'rejected'
  expertise_areas: string[] | null
  linkedin_url: string | null
  github_url: string | null
  website_url: string | null
  is_available: boolean
  timezone: string | null
  verified_at: string | null
  verification_notes: string | null
  created_at: string
  updated_at: string
}

export interface JWTClaims {
  role: string
  status: string
  permissions: string[]
  user_id: string
}

export interface AuthState {
  user: User | null
  profile: UserProfile | null
  claims: JWTClaims | null
  loading: boolean
  profileLoading: boolean
  isAuthenticated: boolean
  supabaseReady: boolean
}

export interface AuthOperations {
  signUp: (data: SignUpData) => Promise<AuthResult>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signInWithGoogle: () => Promise<AuthResult>
  signInWithLinkedIn: () => Promise<AuthResult>
  signInWithGitHub: () => Promise<AuthResult>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
}

export interface SignUpData {
  email: string
  password: string
  firstName: string
  lastName: string
  userType: 'mentor' | 'mentee'
}

export interface AuthResult {
  error: Error | null
  data?: any
}

export interface UseAuthReturn extends AuthState, AuthOperations {
  // Helper methods
  needsRoleSelection: () => boolean
  needsVerification: () => boolean
  hasRole: (role: string) => boolean
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean

  // Convenience getters
  isAdmin: boolean
  isMentor: boolean
  isMentee: boolean
  isVolunteer: boolean
  isModerator: boolean
  isPending: boolean
}

// Consolidated useAuth hook
const useConsolidatedAuth = (): UseAuthReturn => {
  // State
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [claims, setClaims] = useState<JWTClaims | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [supabaseReady, setSupabaseReady] = useState(false)

  // Supabase client getter
  const getSupabaseClient = useCallback(() => {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase não está configurado. Verifique as variáveis de ambiente.")
    }

    const client = createClient()
    if (!client) {
      throw new Error("Não foi possível criar o cliente Supabase.")
    }

    return client
  }, [])

  // Extract JWT claims from session
  const extractJWTClaims = useCallback((session: any): JWTClaims | null => {
    if (!session?.access_token) return null

    try {
      // Decode JWT payload (base64 decode the middle part)
      const payload = JSON.parse(atob(session.access_token.split('.')[1]))

      return {
        role: payload.role || 'pending',
        status: payload.status || 'pending',
        permissions: payload.permissions || [],
        user_id: payload.user_id || payload.sub
      }
    } catch (error) {
      console.error("Erro ao extrair claims do JWT:", error)
      return null
    }
  }, [])

  // Fetch user profile
  const fetchUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    if (!isSupabaseConfigured()) {
      console.warn("Supabase não configurado, pulando busca de perfil")
      return null
    }

    try {
      setProfileLoading(true)
      const supabase = getSupabaseClient()

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (error) {
        console.error("Erro ao buscar perfil:", error)
        return null
      }

      return data as UserProfile
    } catch (error) {
      console.error("Erro ao buscar perfil:", error)
      return null
    } finally {
      setProfileLoading(false)
    }
  }, [getSupabaseClient])

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (!user?.id) return

    const updatedProfile = await fetchUserProfile(user.id)
    if (updatedProfile) {
      setProfile(updatedProfile)
    }
  }, [user?.id, fetchUserProfile])

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user?.id) throw new Error("Usuário não autenticado")

    try {
      const supabase = getSupabaseClient()

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)

      if (error) throw error

      // Refresh profile after update
      await refreshProfile()
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      throw error
    }
  }, [user?.id, getSupabaseClient, refreshProfile])

  // Authentication operations
  const signUp = useCallback(async (data: SignUpData): Promise<AuthResult> => {
    try {
      console.log("🔄 Iniciando signUp:", { email: data.email, firstName: data.firstName, lastName: data.lastName, userType: data.userType })

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email.toLowerCase().trim(),
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          userType: data.userType,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("❌ Erro no signUp:", result.error)
        throw new Error(result.error)
      }

      console.log("✅ SignUp bem-sucedido:", result.user?.id)
      return { error: null, data: result }
    } catch (error) {
      console.error("❌ Erro inesperado no signUp:", error)
      return { error: error as Error }
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      console.log("🔄 Iniciando signIn:", { email })

      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      })

      if (error) {
        console.error("❌ Erro no signIn:", error)
        throw error
      }

      console.log("✅ SignIn bem-sucedido:", data.user?.id)
      return { error: null, data }
    } catch (error) {
      console.error("❌ Erro inesperado no signIn:", error)
      return { error: error as Error }
    }
  }, [getSupabaseClient])

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    try {
      console.log("🔄 Iniciando Google OAuth")

      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      if (error) {
        console.error("❌ Erro no Google OAuth:", error)
        throw error
      }

      console.log("✅ Google OAuth iniciado")
      return { error: null, data }
    } catch (error) {
      console.error("❌ Erro inesperado no Google OAuth:", error)
      return { error: error as Error }
    }
  }, [getSupabaseClient])

  const signInWithLinkedIn = useCallback(async (): Promise<AuthResult> => {
    try {
      console.log("🔄 Iniciando LinkedIn OAuth")

      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "linkedin_oidc",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: "consent",
          },
        },
      })

      if (error) {
        console.error("❌ Erro no LinkedIn OAuth:", error)
        throw error
      }

      console.log("✅ LinkedIn OAuth iniciado")
      return { error: null, data }
    } catch (error) {
      console.error("❌ Erro inesperado no LinkedIn OAuth:", error)
      return { error: error as Error }
    }
  }, [getSupabaseClient])

  const signInWithGitHub = useCallback(async (): Promise<AuthResult> => {
    try {
      console.log("🔄 Iniciando GitHub OAuth")

      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: "consent",
          },
        },
      })

      if (error) {
        console.error("❌ Erro no GitHub OAuth:", error)
        throw error
      }

      console.log("✅ GitHub OAuth iniciado")
      return { error: null, data }
    } catch (error) {
      console.error("❌ Erro inesperado no GitHub OAuth:", error)
      return { error: error as Error }
    }
  }, [getSupabaseClient])

  const signOut = useCallback(async (): Promise<void> => {
    try {
      console.log("🔄 Iniciando signOut")

      // Try API route first for better server-side cleanup
      try {
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("API logout failed")
        }

        console.log("✅ API logout bem-sucedido")
      } catch (apiError) {
        console.warn("⚠️ API logout falhou, tentando logout direto:", apiError)

        // Fallback to direct Supabase logout
        const supabase = getSupabaseClient()
        const { error } = await supabase.auth.signOut()

        if (error) {
          console.error("❌ Erro no signOut direto:", error)
          throw error
        }
      }

      // Clear state regardless of method used
      setUser(null)
      setProfile(null)
      setClaims(null)
      setIsAuthenticated(false)

      // Clear any local storage items
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token')
        sessionStorage.clear()
      }

      console.log("✅ SignOut bem-sucedido")
    } catch (error) {
      console.error("❌ Erro inesperado no signOut:", error)

      // Even if logout fails, clear local state to prevent stuck sessions
      setUser(null)
      setProfile(null)
      setClaims(null)
      setIsAuthenticated(false)

      throw error
    }
  }, [getSupabaseClient])

  // Helper methods
  const needsRoleSelection = useCallback((): boolean => {
    if (!user || !profile) return false
    return !profile.role || profile.role === 'pending'
  }, [user, profile])

  const needsVerification = useCallback((): boolean => {
    if (!user || !profile) return false
    return profile.role === 'mentor' && profile.verification_status === 'pending_validation'
  }, [user, profile])

  const hasRole = useCallback((role: string): boolean => {
    return claims?.role === role || profile?.role === role
  }, [claims?.role, profile?.role])

  const hasPermission = useCallback((permission: string): boolean => {
    return claims?.permissions?.includes(permission) || false
  }, [claims?.permissions])

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissions.some(p => hasPermission(p))
  }, [hasPermission])

  // Initialize authentication
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      if (!isSupabaseConfigured()) {
        console.warn("Supabase não configurado, pulando inicialização de auth")
        if (mounted) {
          setLoading(false)
        }
        return
      }

      try {
        const supabase = getSupabaseClient()
        setSupabaseReady(true)

        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Erro ao obter sessão:", error)
        }

        if (mounted) {
          if (session?.user) {
            setUser(session.user)
            setIsAuthenticated(true)

            // Extract JWT claims
            const jwtClaims = extractJWTClaims(session)
            setClaims(jwtClaims)

            // Fetch profile
            const userProfile = await fetchUserProfile(session.user.id)
            setProfile(userProfile)
          } else {
            setUser(null)
            setProfile(null)
            setClaims(null)
            setIsAuthenticated(false)
          }

          setLoading(false)
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log("Auth state changed:", event, session?.user?.id)

          if (mounted) {
            if (session?.user) {
              setUser(session.user)
              setIsAuthenticated(true)

              // Extract JWT claims
              const jwtClaims = extractJWTClaims(session)
              setClaims(jwtClaims)

              // Fetch profile on sign in or token refresh
              if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                const userProfile = await fetchUserProfile(session.user.id)
                setProfile(userProfile)
              }
            } else {
              setUser(null)
              setProfile(null)
              setClaims(null)
              setIsAuthenticated(false)
            }

            setLoading(false)
          }
        })

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Erro ao inicializar autenticação:", error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
    }
  }, [getSupabaseClient, extractJWTClaims, fetchUserProfile])

  // Convenience getters
  const isAdmin = hasRole('admin')
  const isMentor = hasRole('mentor')
  const isMentee = hasRole('mentee')
  const isVolunteer = hasRole('volunteer')
  const isModerator = hasRole('moderator')
  const isPending = hasRole('pending')

  return {
    // State
    user,
    profile,
    claims,
    loading,
    profileLoading,
    isAuthenticated,
    supabaseReady,

    // Operations
    signUp,
    signIn,
    signInWithGoogle,
    signInWithLinkedIn,
    signInWithGitHub,
    signOut,
    refreshProfile,
    updateProfile,

    // Helper methods
    needsRoleSelection,
    needsVerification,
    hasRole,
    hasPermission,
    hasAnyPermission,

    // Convenience getters
    isAdmin,
    isMentor,
    isMentee,
    isVolunteer,
    isModerator,
    isPending,
  }
}

const AuthContext = createContext<UseAuthReturn | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useConsolidatedAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}