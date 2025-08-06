"use client"

import type React from "react"

import { createContext, useContext, useEffect } from "react"
import { useCurrentUser, useLogin, useLogout, useRegister, useUpdateProfile } from "@/hooks/api/use-auth"

// Auth context type
interface AuthContextType {
  user: any
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (data: any) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: any) => Promise<void>
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // React Query hooks
  const { data: userData, isLoading: isUserLoading, refetch } = useCurrentUser()
  const { mutateAsync: loginMutation, isPending: isLoginLoading } = useLogin()
  const { mutateAsync: registerMutation, isPending: isRegisterLoading } = useRegister()
  const { mutateAsync: logoutMutation, isPending: isLogoutLoading } = useLogout()
  const { mutateAsync: updateProfileMutation, isPending: isUpdateLoading } = useUpdateProfile()


  // Determine if we're using dev auth or real auth
  const isDev = process.env.NODE_ENV === "development"
  // const user = isDev ? devAuthUser : userData?.data
  const user: any = ''

  const isLoading = isUserLoading || isLoginLoading || isRegisterLoading || isLogoutLoading || isUpdateLoading

  // Auth methods
  const signIn = async (email: string, password: string) => {
    await loginMutation({ email, password })
  }

  const signUp = async (data: any) => {
    await registerMutation(data)
  }

  const signOut = async () => {
    await logoutMutation()
  }

  const updateProfile = async (updates: any) => {
    await updateProfileMutation(updates)
  }

  // Refresh user data when needed
  useEffect(() => {
    if (!isDev) {
      const refreshInterval = setInterval(
        () => {
          refetch()
        },
        5 * 60 * 1000,
      ) // Refresh every 5 minutes

      return () => clearInterval(refreshInterval)
    }
  }, [refetch, isDev])

  // Context value
  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
