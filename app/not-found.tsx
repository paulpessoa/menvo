"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function NotFoundPage() {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center space-y-6">
      <h1 className="text-5xl font-bold text-primary">404</h1>
      <p className="text-lg text-muted-foreground">Page not found</p>
      <Button onClick={() => router.back()} variant="default">
        Voltar para a página anterior
      </Button>
    </div>
  )
}
