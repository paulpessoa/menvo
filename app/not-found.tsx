import Link from "next/link"
import { Compass, Home } from "lucide-react"

/**
 * Root 404 page fallback.
 * Next.js triggers this when a route is accessed outside of any localized sub-tree.
 * Since the root layout does not define <html>/<body> tags, this root not-found must provide them.
 */
export default function GlobalNotFound() {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-background text-foreground font-sans antialiased flex items-center justify-center p-4">
        <main className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
            <Compass className="w-3.5 h-3.5" />
            <span>Erro 404</span>
          </div>

          <div className="select-none">
            <span className="text-8xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-cyan-500">
              404
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Página não encontrada
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              O endereço acessado não existe ou foi alterado. Vamos te levar de volta para a Menvo.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-colors shadow-md"
            >
              <Home className="w-4 h-4" />
              Voltar ao Início
            </Link>
          </div>
        </main>
      </body>
    </html>
  )
}
