import type { Metadata } from "next"
import NotFoundClient from "./NotFoundClient"

export const metadata: Metadata = {
  title: "Página não encontrada | Menvo",
  description: "A página solicitada não foi encontrada.",
  robots: {
    index: false,
    follow: false
  }
}

/**
 * Server Component para a página 404 localizada.
 * Emite metadados com noindex no cabeçalho HTTP e renderiza o cliente interativo.
 */
export default function NotFound() {
  return <NotFoundClient />
}
