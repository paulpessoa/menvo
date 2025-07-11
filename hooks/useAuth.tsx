"use client"

import type React from "react"

import { getSupabaseClient } from "@/lib/supabase"
import { useSession } from "@supabase/auth-helpers-react"
import { createContext, useContext, useEffect, useState } from "react"

type AuthContextType = {
  supabaseClient: any
  session: any
}

const AuthContext = createContext<AuthContextType>({
  supabaseClient: null,
  session: null,
})

export const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [supabaseClient] = useState(() => getSupabaseClient())
  const session = useSession()

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {})

    supabaseClient.auth.onAuthStateChange((_event, session) => {})
  }, [supabaseClient])

  const value = {
    supabaseClient,
    session,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuthContext = () => {
  return useContext(AuthContext)
}
