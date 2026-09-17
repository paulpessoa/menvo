import type { Metadata } from "next"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true
  }
}

interface AuthLayoutProps {
  children: React.ReactNode
}

/**
 * Layout unificado para todas as páginas de autenticação do Menvo.
 * Não repete a logo — o Header global já a exibe no topo.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-gray-50/80 via-white to-gray-50/80 text-gray-900">
      {/* Conteúdo Central */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md animate-in fade-in-50 duration-300">
          {children}
        </div>
      </main>

      {/* Rodapé Simples */}
      <footer className="w-full py-4 px-4 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Menvo. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
