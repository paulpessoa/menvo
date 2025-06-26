"use client"
import { useEffect, useState, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/services/auth/supabase'
import { useMutation } from '@tanstack/react-query'
import {jwtDecode} from 'jwt-decode'

interface AuthContextType {
  user: any
  isAuthenticated: boolean
  loading: boolean
  logout: () => Promise<void>
}

interface DecodedToken {
  role?: string
  [key: string]: any
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

 useEffect(() => {
  const getUser = async () => {
    setLoading(true)

    const { data: authUser, error: authError } = await supabase.auth.getUser()
    const { data: sessionData } = await supabase.auth.getSession()

    if (authError || !authUser.user) {
      console.error(authError)
      setUser(null)
      setLoading(false)
      return
    }

    let roleFromToken: string | undefined = undefined
    if (sessionData?.session?.access_token) {
      try {
        const decoded: DecodedToken = jwtDecode(sessionData.session.access_token)
        roleFromToken = decoded.role
      } catch (e) {
        console.error('Failed to decode JWT token', e)
      }
    }

    setUser({
      ...authUser.user,
      role: roleFromToken
    })
    setLoading(false)
  }
  getUser()

  const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
  if (session?.user) {

    let roleFromToken: string | undefined = undefined
    if (session.access_token) {
      try {
        const decoded: DecodedToken = jwtDecode(session.access_token)
        roleFromToken = decoded.role
      } catch (e) {
        console.error('Failed to decode JWT token', e)
      }
    }

    setUser({
      ...session.user,
      role: roleFromToken
    })
  } else {
    setUser(null)
  }
})

  return () => {
    listener.subscription.unsubscribe()
  }
}, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: async ({ email, password }: { email: string, password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return data
    }
  })
}


// "use client"
// import { createContext, useContext, useEffect, useState } from "react"
// import { useRouter } from "next/navigation"
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
// import { useAuthMeQuery } from "./useAuthMeQuery"
// import { supabase } from '@/services/auth/supabase'

// interface User {
//   id: string
//   email: string
//   first_name?: string
//   last_name?: string
//   profile_picture_url?: string
//   roles?: string[]
//   [key: string]: any // Para campos extras do perfil
// }

// interface AuthContextType {
//   user: User | null
//   isAuthenticated: boolean
//   isLoading: boolean
//   login: (data: { email: string; password: string }) => Promise<void>
//   logout: () => Promise<void>
//   register: (data: { email: string; password: string; [key: string]: any }) => Promise<void>
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined)

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const queryClient = useQueryClient()
//   const router = useRouter()
//   const [autenticated, setAutenticated] = useState(false)
//   const { data, isLoading: isAuthLoading, refetch } = useAuthMeQuery("oi")

//   useEffect(() => {
//     const token = localStorage.getItem('supabase.auth.token')
//     if (token) {
//       setAutenticated(true)
//     } else {
//       setAutenticated(false)
//     }
//   }, [])

//   // Login mutation
//   const { mutateAsync: login, isPending: isLoggingIn, isSuccess: isLoggedIn } = useMutation({
//     mutationFn: async ({ email, password }: { email: string; password: string }) => {
//       const res = await fetch("/api/auth/login", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, password }),
//         credentials: 'include'
//       })
//       if (!res.ok) {
//         const err = await res.json()
//         throw new Error(err.error || "Login failed")
//       }
//       const data = await res.json()
//       // Save the session data to localStorage
//       if (data.session) {
//         localStorage.setItem('supabase.auth.token', JSON.stringify({
//           currentSession: {
//             access_token: data.session.access_token,
//             refresh_token: data.session.refresh_token
//           }
//         }))
//         setAutenticated(true)
//       }
//       return data
//     },
//     onSuccess: async () => {
//       await queryClient.invalidateQueries({ queryKey: ["auth-me"] })
//       await refetch()
//       router.push("/")
//     }
//   })

//   // Logout mutation
//   const { mutateAsync: logout } = useMutation({
//     mutationFn: async () => {
//       const res = await fetch("/api/auth/logout", { 
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         credentials: 'include'
//       })
//       if (!res.ok) {
//         const err = await res.json()
//         throw new Error(err.error || "Logout failed")
//       }
//       // Limpa o localStorage
//       localStorage.removeItem('supabase.auth.token')
//       setAutenticated(false)
//       return res.json()
//     },
//     onSuccess: async () => {
//       await queryClient.invalidateQueries({ queryKey: ["auth-me"] })
//       await refetch()
//       router.push("/")
//     }
//   })

//   // Register mutation
//   const { mutateAsync: register } = useMutation({
//     mutationFn: async (data: { email: string; password: string; [key: string]: any }) => {
//       const res = await fetch("/api/auth/register", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(data),
//         credentials: 'include'
//       })
//       if (!res.ok) {
//         const err = await res.json()
//         throw new Error(err.error || "Register failed")
//       }
//       return res.json()
//     },
//     onSuccess: async () => {
//       await queryClient.invalidateQueries({ queryKey: ["auth-me"] })
//       await refetch()
//       router.push("/")
//     }
//   })

//   return (
//     <AuthContext.Provider
//       value={{
//         user: data?.user ?? null,
//         isAuthenticated: autenticated || isLoggedIn || !!data?.user,
//         isLoading: isAuthLoading || isLoggingIn,
//         login: async (data) => await login(data),
//         logout: async () => await logout(),
//         register: async (data) => await register(data),
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   )
// }

// export function useAuth() {
//   const ctx = useContext(AuthContext)
//   if (!ctx) throw new Error("useAuth must be used within AuthProvider")
//   return ctx
// }
