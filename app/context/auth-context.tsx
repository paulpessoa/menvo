"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/utils/supabase/client"
import { useRouter, usePathname } from "next/navigation"

interface Profile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  full_name?: string
  role?: string
  status?: string
  verification_status?: string
  avatar_url?: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  authenticated: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const refreshUser = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        setUser(null)
        setProfile(null)
        return
      }

      setUser(user)

      // Buscar perfil
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (profileData) {
        setProfile(profileData)
      }
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      setUser(null)
      setProfile(null)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      router.push("/")
    } catch (error) {
      console.error("Erro no logout:", error)
    }
  }

  useEffect(() => {
    // Carregar usuário inicial
    refreshUser().finally(() => setLoading(false))

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth state changed:", event, session?.user?.email)

      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user)
        await refreshUser()

        // Redirecionar após login
        if (pathname === "/login" || pathname === "/signup") {
          router.push("/dashboard")
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setProfile(null)

        // Redirecionar após logout se estiver em página protegida
        const protectedPaths = ["/dashboard", "/profile", "/admin", "/checkin"]
        if (protectedPaths.some((path) => pathname.startsWith(path))) {
          router.push("/")
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [pathname, router, supabase.auth])

  const authenticated = !!user

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        authenticated,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useCurrentUser() {
  const context = useContext(AuthContext)
  return context
}
