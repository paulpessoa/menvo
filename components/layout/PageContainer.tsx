import React from "react"
import { cn } from "@/lib/utils"

export type PageContainerSize = "default" | "7xl" | "6xl" | "5xl" | "4xl" | "3xl" | "full"

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Largura máxima do container:
   * - "default" / "7xl": max-w-7xl (1280px) — padrão da aplicação
   * - "6xl": max-w-6xl (1152px)
   * - "5xl": max-w-5xl (1024px)
   * - "4xl": max-w-4xl (896px)
   * - "3xl": max-w-3xl (768px) — recomendado para páginas textuais (termos, privacidade)
   * - "full": max-w-full (sem limite de largura)
   */
  size?: PageContainerSize
  /**
   * Elemento raiz a ser renderizado (default: "div")
   */
  as?: React.ElementType
}

const sizeClasses: Record<PageContainerSize, string> = {
  default: "max-w-7xl",
  "7xl": "max-w-7xl",
  "6xl": "max-w-6xl",
  "5xl": "max-w-5xl",
  "4xl": "max-w-4xl",
  "3xl": "max-w-3xl",
  full: "max-w-full"
}

/**
 * Componente padrão de largura e espaçamento de página.
 * Centraliza o conteúdo e garante espaçamento horizontal e vertical uniforme.
 *
 * @example
 * ```tsx
 * <PageContainer>
 *   <h1>Meu Título</h1>
 * </PageContainer>
 * ```
 */
export function PageContainer({
  size = "default",
  as: Component = "div",
  className,
  children,
  ...props
}: PageContainerProps) {
  return (
    <Component
      className={cn(
        "container mx-auto px-4 sm:px-6 lg:px-8 py-8",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
