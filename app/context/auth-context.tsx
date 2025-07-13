"use client"

import type React from "react"

import type { User } from "@supabase/supabase-js"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { jwtDecode } from "jwt-decode"

// Tipagem para os claims customizados no JWT
interface DecodedToken {
  exp: number
  role: string
  status: string
  permissions: string[]
}

interface AuthContextType {
  user: User | null
  profile: any | null // Defina uma tipagem mais forte se desejar
  role: string | null
  permissions: string[]
  isAuthenticated: boolean
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const loadSession = useCallback(
    async (sessionUser: User | null) => {
      if (sessionUser) {
        setUser(sessionUser)

        // Buscar perfil do usuário
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", sessionUser.id).single()
        setProfile(profileData)

        // Decodificar o token para obter claims
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData.session) {
          try {
            const decoded: DecodedToken = jwtDecode(sessionData.session.access_token)
            setRole(decoded.role)
            setPermissions(decoded.permissions || [])
          } catch (e) {
            console.error("Error decoding JWT:", e)
            setRole(null)
            setPermissions([])
          }
        }
      } else {
        // Limpar estado se não houver usuário
        setUser(null)
        setProfile(null)
        setRole(null)
        setPermissions([])
      }
    },
    [supabase],
  )

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setRole(null)
    setPermissions([])
    router.push("/")
  }

  useEffect(() => {
    setLoading(true)
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        loadSession(session?.user ?? null)
      })
      .finally(() => setLoading(false))

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setLoading(true)
      await loadSession(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [loadSession, supabase.auth])

  const value = {
    user,
    profile,
    role,
    permissions,
    isAuthenticated: !!user,
    loading,
    signOut,
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
