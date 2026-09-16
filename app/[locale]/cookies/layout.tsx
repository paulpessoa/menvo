import type { Metadata } from "next"

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const path = locale === "pt-BR" ? "/cookies" : `/${locale}/cookies`

  return {
    title: "Política de Cookies | Menvo",
    description:
      "Informações sobre a utilização de cookies e tecnologias de rastreamento na plataforma Menvo.",
    alternates: {
      canonical: path,
      languages: {
        "pt-BR": "/cookies",
        en: "/en/cookies",
        es: "/es/cookies"
      }
    },
    openGraph: {
      title: "Política de Cookies | Menvo",
      description:
        "Informações sobre a utilização de cookies e tecnologias de rastreamento na plataforma Menvo.",
      url: `https://www.menvo.com.br${path}`,
      siteName: "Menvo",
      locale
    }
  }
}

export default function CookiesLayout({
  children
}: {
  children: React.ReactNode
}) {
  return children
}
