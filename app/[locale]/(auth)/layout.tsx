import { Link } from "@/i18n/routing"
import Image from "next/image"

interface AuthLayoutProps {
  children: React.ReactNode
}

/**
 * Layout unificado para todas as páginas de autenticação do Menvo.
 * Oferece consistência visual, branding padronizado e responsividade.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-gray-50/80 via-white to-gray-50/80 text-gray-900">
      {/* Header com Logo */}
      <header className="w-full py-6 px-4 sm:px-8 flex justify-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg p-1"
          aria-label="Menvo Home"
        >
          <Image
            src="/menvo-logo-light.png"
            alt="Menvo"
            width={120}
            height={36}
            className="h-8 w-auto object-contain dark:hidden"
            priority
          />
          <Image
            src="/menvo-logo-dark.png"
            alt="Menvo"
            width={120}
            height={36}
            className="h-8 w-auto object-contain hidden dark:block"
            priority
          />
        </Link>
      </header>

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
