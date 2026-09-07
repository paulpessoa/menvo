"use client"

import { useEffect, Suspense } from "react"
import { useRouter } from "@/i18n/routing"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

/**
 * Redirecionador canônico para /update-password.
 * Elimina duplicidade de manutenção mantendo /update-password como
 * o Single Source of Truth para redefinição de senhas.
 */
export default function ResetPasswordRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordRedirectContent />
    </Suspense>
  )
}

function ResetPasswordRedirectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const params = searchParams.toString()
    const target = params ? `/update-password?${params}` : "/update-password"
    router.replace(target)
  }, [router, searchParams])

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
      <p className="text-sm text-muted-foreground">Redirecionando para atualização de senha segura...</p>
    </div>
  )
}
