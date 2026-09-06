"use client"

import { useRouter } from "@/i18n/routing"
import { useEffect } from "react"
import { AuthGuard } from "@/lib/auth/auth-guard"
import { useAuth } from "@/lib/auth"

export default function Dashboard() {
  const { user, role, loading, isInitializing } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isInitializing) {
      if (!user) {
        router.push('/login?next=/dashboard')
        return
      }

      if (role === 'mentor') {
        router.push('/dashboard/mentor')
      } else if (role === 'mentee') {
        router.push('/dashboard/mentee')
      } else if (role === 'admin') {
        router.push('/dashboard/admin')
      } else {
        router.push('/onboarding')
      }
    }
  }, [user, role, loading, isInitializing, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}
