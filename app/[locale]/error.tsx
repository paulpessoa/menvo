"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

/**
 * SSR Error Boundary para rotas localizadas.
 * Captura falhas de renderização em Server/Client Components,
 * evitando que a requisição caia em HTTP 500 desestruturado para o Googlebot.
 */
export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Registra o erro no monitoramento/console
    console.error("[Menvo SSR Error Boundary]:", error)
  }, [error])

  return (
    <main
      id="main-content"
      className="min-h-[calc(100vh-14rem)] flex items-center justify-center px-4 py-16"
    >
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Erro no servidor</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Algo deu errado
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Ocorreu uma instabilidade temporária ao carregar esta página. Nossa equipe técnica já foi notificada.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto gap-2 rounded-xl shadow-md shadow-primary/20 font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto gap-2 rounded-xl border-border hover:bg-muted/60 font-medium"
          >
            <Link href="/">
              <Home className="w-4 h-4" />
              Página inicial
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
