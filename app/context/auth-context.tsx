"use client"

import type React from "react"
import { createContext, useContext } from "react"
import { useQuery } from "@tanstack/react-query"

interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  profile_picture_url?: string
  roles?: string[]
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
})

async function getCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch("/api/auth/me", {
      credentials: "include",
    })

    if (!res.ok) {
      return null
    }

    const data = await res.json()
    return data.user || null
  } catch (error) {
    console.log("Auth check failed:", error)
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: userData, isLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const user = userData || null
  const isAuthenticated = !!user

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
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
