"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/services/auth"

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Auth callback error:", error)
          router.push("/login?error=auth_callback_failed")
          return
        }

        if (data.session) {
          // Successful authentication
          router.push("/dashboard")
        } else {
          // No session found
          router.push("/login")
        }
      } catch (error) {
        console.error("Auth callback error:", error)
        router.push("/login?error=auth_callback_failed")
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="container flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  )
}
