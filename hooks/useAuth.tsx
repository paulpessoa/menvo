"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/utils/supabase/client"
import type { Database } from "@/types/database"
import router from "next/router"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  login: (params: { email: string; password: string }) => Promise<any>
  // Estados computados
  isAuthenticated: boolean
  needsRoleSelection: boolean
  needsProfileCompletion: boolean
  needsVerification: boolean
  canAccessMentorFeatures: boolean
  canAccessAdminFeatures: boolean
  isProfileComplete: boolean
  // Role management
  userState: any
  userPermissions: string[]
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
  updateUserRole: (role: string) => Promise<any>
  completeUserProfile: (data: any) => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchProfile = async (userId: string, userRole?: string) => {
    const role = userRole
    
    if (!role) {
      return null
    }
    
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        if (error.code === "PGRST116") {
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({
              id: userId,
              email: user?.email || '',
              role: role,
              status: 'pending',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (createError) {
            return null
          }

          return newProfile
        } else {
          return null
        }
      }

      return data
    } catch (error) {
      return null
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id, user.user_metadata?.role)
      setProfile(profileData)
    }
  }

  useEffect(() => {
    let mounted = true

    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        setUser(session?.user ?? null)

        if (session?.user) {
          const profileData = await fetchProfile(session.user.id, session.user.user_metadata?.role)
          if (mounted) {
            setProfile(profileData)
          }
        }
      } catch (error) {
        // Ignore errors
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      setUser(session?.user ?? null)

      if (session?.user) {
        const profileData = await fetchProfile(session.user.id, session.user.user_metadata?.role)
        if (mounted) {
          setProfile(profileData)
        }
      } else {
        setProfile(null)
      }

      if (mounted) {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    await supabase.auth.refreshSession()
    
    setUser(null)
    setProfile(null)
  }

  const login = async ({ email, password }: { email: string; password: string }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        throw new Error("E-mail ou senha inválidos.")
      }
      throw new Error("Erro ao fazer login. Tente novamente.")
    }
    return true
  }

  // Estados computados
  const isAuthenticated = !!user
  const needsRoleSelection = !!(user && user.email_confirmed_at && !user.user_metadata?.role)
  const needsProfileCompletion = !!(user && user.user_metadata?.role && profile && profile.status === "pending")
  const needsVerification = !!(user && user.user_metadata?.role === "mentor" && profile && profile.status === "pending")
  const canAccessMentorFeatures = !!(user?.user_metadata?.role === "mentor" && profile?.status === "active")
  const canAccessAdminFeatures = !!(user?.user_metadata?.role === "admin")
  const isProfileComplete = !!(profile?.status === "active")

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signOut,
    refreshProfile,
    login,
    isAuthenticated,
    needsRoleSelection,
    needsProfileCompletion,
    needsVerification,
    canAccessMentorFeatures,
    canAccessAdminFeatures,
    isProfileComplete,
    // Role management - Baseado no JWT
    userState: null,
    userPermissions: user?.user_metadata?.role ? [user.user_metadata.role] : [],
    hasPermission: (permission: string) => user?.user_metadata?.role === permission,
    hasAnyPermission: (permissions: string[]) => permissions.some(p => user?.user_metadata?.role === p),
    hasAllPermissions: (permissions: string[]) => permissions.every(p => user?.user_metadata?.role === p),
    updateUserRole: async (role: string) => {
      try {
        const { error } = await supabase.auth.updateUser({
          data: { role: role }
        })
        
        if (error) {
          return { success: false }
        }
        
        await supabase.auth.refreshSession()
        
        return { success: true }
      } catch (error) {
        return { success: false }
      }
    },
    completeUserProfile: async (data: any) => {
      try {
        if (!user) return { success: false }
        
        const { error } = await supabase
          .from("profiles")
          .upsert({
            id: user.id,
            email: user.email,
            role: user.user_metadata?.role,
            ...data,
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
        
        if (error) {
          return { success: false }
        }
        
        return { success: true }
      } catch (error) {
        return { success: false }
      }
    },
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
// Hook para mutação de login
// export function useLoginMutation() {
//   return useLogin()
// }