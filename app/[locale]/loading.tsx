import Image from "next/image"

/**
 * Loading screen com identidade visual Menvo.
 * Exibido automaticamente pelo Next.js durante transições de rota (Suspense boundary).
 * Logo centralizada + 3 pontos pulsantes na cor brand.
 */
export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background">
      {/* Logo */}
      <div className="relative">
        <Image
          src="/menvo-logo-light.png"
          alt="Menvo"
          width={140}
          height={42}
          className="h-10 w-auto object-contain dark:hidden"
          priority
        />
        <Image
          src="/menvo-logo-dark.png"
          alt="Menvo"
          width={140}
          height={42}
          className="h-10 w-auto object-contain hidden dark:block"
          priority
        />
      </div>

      {/* 3 pontos pulsantes na cor brand */}
      <div className="flex items-center gap-2" role="status" aria-label="Carregando">
        <span
          className="h-2 w-2 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: "0ms", animationDuration: "900ms" }}
        />
        <span
          className="h-2 w-2 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: "160ms", animationDuration: "900ms" }}
        />
        <span
          className="h-2 w-2 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: "320ms", animationDuration: "900ms" }}
        />
        <span className="sr-only">Carregando...</span>
      </div>
    </div>
  )
}
