"use client"

import { MenvoDots } from "@/components/ui/menvo-loader"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"


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
      <MenvoDots />
    </div>
  )
}
