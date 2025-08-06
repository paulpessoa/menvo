"use client"

import { useEffect } from "react"
import { redirect } from 'next/navigation'
import { supabase } from "@/services/auth/supabase" // Corrected import path

export default function AuthPage() {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Auth callback error:", error)
          redirect("/login?error=auth_callback_failed")
          return
        }

        if (data.session) {
          // Successful authentication
          redirect("/dashboard")
        } else {
          // No session found
          redirect("/login")
        }
      } catch (error) {
        console.error("Auth callback error:", error)
        redirect("/login?error=auth_callback_failed")
      }
    }

    handleAuthCallback()
  }, [])

  return (
    <div className="container flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  )
}
