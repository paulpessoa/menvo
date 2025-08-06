"use client"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from '@/services/auth/supabase'
import type { Session, User } from '@supabase/supabase-js'
import { useQueryClient } from "@tanstack/react-query"

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)

        if (event === 'SIGNED_OUT') {
          queryClient.clear()
          router.push('/')
        }
      }
    )

    // Get initial session
    const getInitialSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setIsLoading(false)
    }
    getInitialSession()

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router, queryClient])

  const logout = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    session,
    isLoading,
    logout,
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

// Component to handle redirects for incomplete profiles
export function AuthRedirect() {
  const { user, isLoading } = useAuth()
  const { data: profile } = useUserProfile()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading || !user) return

    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup')
    if (isAuthPage && user) {
      router.push('/dashboard')
      return
    }

    const isWelcomePage = pathname.startsWith('/welcome')
    if (user && profile && !profile.profile_completed && !isWelcomePage) {
      router.push('/welcome')
    }
  }, [user, profile, isLoading, router, pathname])

  return null
}
