import Image from "next/image"
import { cn } from "@/lib/utils"

export function MenvoLoader({ className, fullScreen = false }: { className?: string, fullScreen?: boolean }) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-6 bg-background",
      fullScreen ? "fixed inset-0 z-50" : "w-full py-12",
      className
    )}>
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
        <MenvoDots />
        <span className="sr-only">Carregando...</span>
      </div>
    </div>
  )
}
export function MenvoDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5", className)} role="status" aria-label="Carregando">
      <span
        className="h-1.5 w-1.5 rounded-full bg-current animate-bounce"
        style={{ animationDelay: "0ms", animationDuration: "900ms" }}
      />
      <span
        className="h-1.5 w-1.5 rounded-full bg-current animate-bounce"
        style={{ animationDelay: "160ms", animationDuration: "900ms" }}
      />
      <span
        className="h-1.5 w-1.5 rounded-full bg-current animate-bounce"
        style={{ animationDelay: "320ms", animationDuration: "900ms" }}
      />
      <span className="sr-only">Carregando...</span>
    </div>
  )
}
