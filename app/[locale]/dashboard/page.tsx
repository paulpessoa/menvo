"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { AuthGuard } from "@/lib/auth/auth-guard"
import { useAuth } from "@/lib/auth"

export default function Dashboard() {
  const { role, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && role) {
      // Redirect to role-specific dashboard
      switch (role) {
        case 'mentor':
          router.push('/dashboard/mentor')
          break
        case 'mentee':
          router.push('/dashboard/mentee')
          break
        case 'admin':
          router.push('/dashboard/admin')
          break
        default:
          // If no role, AuthGuard will handle redirect to role selection
          break
      }
    }
  }, [role, loading, router])

  // Show loading while determining role
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <AuthGuard requireRole>
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    </AuthGuard>
  )
}
