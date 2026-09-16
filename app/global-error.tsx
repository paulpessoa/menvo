"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

/**
 * Root Error Boundary para a raiz da aplicação (fora de layouts específicos).
 * Define <html> e <body> próprios para garantir renderização quando o layout principal falha.
 */
export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Menvo Global Error Boundary]:", error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-white text-gray-900 font-sans antialiased flex items-center justify-center p-4">
        <main className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Instabilidade temporária</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Problema no servidor
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              Encontramos uma instabilidade inesperada no servidor. Por favor, tente novamente em instantes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => reset()}
              type="button"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#007585] hover:bg-[#006276] text-white font-medium text-sm transition-colors shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium text-sm transition-colors"
            >
              <Home className="w-4 h-4" />
              Página inicial
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}
