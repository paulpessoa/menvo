"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { AuthService } from "./auth-service"
import type { AuthState, User, SignUpData, CompleteProfileData } from "./types"

interface AuthContextType extends AuthState {
  signUp: (data: SignUpData) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithLinkedIn: () => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  completeProfile: (data: CompleteProfileData) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    initialized: false,
  })

  const updateState = (updates: Partial<AuthState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }

  const loadUserData = async (user: User | null) => {
    if (!user) {
      updateState({ user: null, profile: null, loading: false })
      return
    }

    try {
      const profile = await AuthService.getCurrentProfile()
      updateState({ user, profile, loading: false })
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error)
      updateState({ user, profile: null, loading: false })
    }
  }

  const signUp = async (data: SignUpData) => {
    updateState({ loading: true })
    try {
      await AuthService.signUp(data)
      updateState({ loading: false })
    } catch (error) {
      updateState({ loading: false })
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    updateState({ loading: true })
    try {
      const { user } = await AuthService.signIn(email, password)
      await loadUserData(user)
    } catch (error) {
      updateState({ loading: false })
      throw error
    }
  }

  const signInWithGoogle = async () => {
    updateState({ loading: true })
    try {
      await AuthService.signInWithGoogle()
      // O redirecionamento será tratado pelo OAuth
    } catch (error) {
      updateState({ loading: false })
      throw error
    }
  }

  const signInWithLinkedIn = async () => {
    updateState({ loading: true })
    try {
      await AuthService.signInWithLinkedIn()
      // O redirecionamento será tratado pelo OAuth
    } catch (error) {
      updateState({ loading: false })
      throw error
    }
  }

  const signOut = async () => {
    updateState({ loading: true })
    try {
      await AuthService.signOut()
      updateState({ user: null, profile: null, loading: false })
    } catch (error) {
      updateState({ loading: false })
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    await AuthService.resetPassword(email)
  }

  const updatePassword = async (password: string) => {
    await AuthService.updatePassword(password)
  }

  const completeProfile = async (data: CompleteProfileData) => {
    updateState({ loading: true })
    try {
      await AuthService.completeProfile(data)
      await refreshProfile()
    } catch (error) {
      updateState({ loading: false })
      throw error
    }
  }

  const refreshProfile = async () => {
    if (!state.user) return

    try {
      const profile = await AuthService.getCurrentProfile()
      updateState({ profile })
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const user = await AuthService.getCurrentUser()
        if (mounted) {
          await loadUserData(user)
          updateState({ initialized: true })
        }
      } catch (error) {
        console.error("Erro ao inicializar auth:", error)
        if (mounted) {
          updateState({ loading: false, initialized: true })
        }
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = AuthService.onAuthStateChange(async (user) => {
      if (mounted) {
        await loadUserData(user)
        updateState({ initialized: true })
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value: AuthContextType = {
    ...state,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithLinkedIn,
    signOut,
    resetPassword,
    updatePassword,
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
