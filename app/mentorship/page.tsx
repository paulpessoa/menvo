"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Loader2 } from "lucide-react"

export default function MentorshipPage() {
  const { role, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && role) {
      // Redirecionar baseado no papel
      if (role === 'mentor') {
        router.push('/mentorship/mentor')
      } else if (role === 'mentee') {
        router.push('/mentorship/mentee')
      } else {
        router.push('/dashboard')
      }
    }
  }, [role, loading, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  )
}
