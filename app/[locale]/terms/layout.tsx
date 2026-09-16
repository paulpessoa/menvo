import type { Metadata } from "next"

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const path = locale === "pt-BR" ? "/terms" : `/${locale}/terms`

  return {
    title: "Termos de Uso | Menvo",
    description:
      "Termos e condições de uso da plataforma de mentoria voluntária Menvo.",
    alternates: {
      canonical: path,
      languages: {
        "pt-BR": "/terms",
        en: "/en/terms",
        es: "/es/terms"
      }
    },
    openGraph: {
      title: "Termos de Uso | Menvo",
      description:
        "Termos e condições de uso da plataforma de mentoria voluntária Menvo.",
      url: `https://www.menvo.com.br${path}`,
      siteName: "Menvo",
      locale
    }
  }
}

export default function TermsLayout({
  children
}: {
  children: React.ReactNode
}) {
  return children
}
