"use client"

import { useEffect } from "react"
import { useRouter } from "@/i18n/routing"
import { useAuth } from "@/lib/auth"
import { Loader2 } from "lucide-react"

/**
 * Redirecionador para a página correta de verificações administrativas.
 * Garante compatibilidade caso alguém acesse /verifications diretamente.
 */
export default function VerificationsRedirectPage() {
  const router = useRouter()
  const { user, isAdmin, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace("/login?next=/dashboard/admin/verifications")
    } else if (isAdmin) {
      router.replace("/dashboard/admin/verifications")
    } else {
      router.replace("/dashboard")
    }
  }, [user, isAdmin, loading, router])

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
      <p className="text-sm text-muted-foreground">Redirecionando para a central de verificações...</p>
    </div>
  )
}
