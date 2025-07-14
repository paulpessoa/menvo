"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import type { User } from "@supabase/supabase-js"
import type { UserRole, Permission } from "@/lib/auth/rbac"

interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  role: UserRole
  status: "pending" | "active" | "suspended" | "rejected"
  verification_status: "pending" | "verified" | "rejected"
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  permissions: Permission[]
  role: UserRole | null
  loading: boolean
  initialized: boolean
  signUp: (email: string, password: string, fullName: string, userType: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithGoogle: () => Promise<{ error: string | null }>
  signInWithLinkedIn: () => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  completeProfile: (data: any) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  const supabase = createClient()

  const loadUserData = async (currentUser: User | null) => {
    if (!currentUser) {
      setUser(null)
      setProfile(null)
      setPermissions([])
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setProfile(data.profile)
        setPermissions(data.permissions || [])
      } else {
        setUser(currentUser)
        setProfile(null)
        setPermissions([])
      }
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error)
      setUser(currentUser)
      setProfile(null)
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName: string, userType: string) => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, userType }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error }
      }

      return { error: null }
    } catch (error) {
      return { error: "Erro inesperado" }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setLoading(false)
        return { error: data.error }
      }

      await loadUserData(data.user)
      return { error: null }
    } catch (error) {
      setLoading(false)
      return { error: "Erro inesperado" }
    }
  }

  const signInWithGoogle = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setLoading(false)
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      setLoading(false)
      return { error: "Erro inesperado" }
    }
  }

  const signInWithLinkedIn = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "linkedin_oidc",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setLoading(false)
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      setLoading(false)
      return { error: "Erro inesperado" }
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setPermissions([])
    } catch (error) {
      console.error("Erro no logout:", error)
    } finally {
      setLoading(false)
    }
  }

  const completeProfile = async (data: any) => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setLoading(false)
        return { error: result.error }
      }

      await refreshProfile()
      return { error: null }
    } catch (error) {
      setLoading(false)
      return { error: "Erro inesperado" }
    }
  }

  const refreshProfile = async () => {
    if (!user) return

    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
        setPermissions(data.permissions || [])
      }
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()
        if (mounted) {
          await loadUserData(currentUser)
          setInitialized(true)
        }
      } catch (error) {
        console.error("Erro ao inicializar auth:", error)
        if (mounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        await loadUserData(session?.user || null)
        setInitialized(true)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value: AuthContextType = {
    user,
    profile,
    permissions,
    role: profile?.role || null,
    loading,
    initialized,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithLinkedIn,
    signOut,
    completeProfile,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
