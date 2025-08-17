"use client"

import type React from "react"
import type { User } from "@supabase/supabase-js"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  profile: any | null
  role: string | null
  permissions: string[]
  isAuthenticated: boolean
  loading: boolean
  signOut: () => Promise<void>
  supabaseReady: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [supabaseReady, setSupabaseReady] = useState(false)
  const router = useRouter()

  const checkSupabaseConfig = useCallback(() => {
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    return hasUrl && hasKey
  }, [])

  const loadSession = useCallback(async () => {
    if (!checkSupabaseConfig()) {
      console.warn("Supabase não configurado - variáveis de ambiente ausentes")
      setLoading(false)
      return
    }

    try {
      const { createClient } = await import("@/utils/supabase/client")
      const supabase = createClient()
      setSupabaseReady(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)

        // Buscar perfil do usuário
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()

        setProfile(profileData)
        setRole(profileData?.role || null)
      } else {
        setUser(null)
        setProfile(null)
        setRole(null)
        setPermissions([])
      }

      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser(session.user)
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single()
          setProfile(profileData)
          setRole(profileData?.role || null)
        } else {
          setUser(null)
          setProfile(null)
          setRole(null)
          setPermissions([])
        }
      })

      return () => {
        authListener.subscription.unsubscribe()
      }
    } catch (error) {
      console.error("Erro ao configurar autenticação:", error)
    } finally {
      setLoading(false)
    }
  }, [checkSupabaseConfig])

  const signOut = async () => {
    if (!supabaseReady) return

    try {
      const { createClient } = await import("@/utils/supabase/client")
      const supabase = createClient()
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setRole(null)
      setPermissions([])
      router.push("/")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }

  useEffect(() => {
    loadSession()
  }, [loadSession])

  const value = {
    user,
    profile,
    role,
    permissions,
    isAuthenticated: !!user,
    loading,
    signOut,
    supabaseReady,
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
