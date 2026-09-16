import type { Metadata } from "next"

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const path = locale === "pt-BR" ? "/privacy" : `/${locale}/privacy`

  return {
    title: "Política de Privacidade | Menvo",
    description:
      "Política de privacidade e proteção de dados da plataforma Menvo em conformidade com a LGPD.",
    alternates: {
      canonical: path,
      languages: {
        "pt-BR": "/privacy",
        en: "/en/privacy",
        es: "/es/privacy"
      }
    },
    openGraph: {
      title: "Política de Privacidade | Menvo",
      description:
        "Política de privacidade e proteção de dados da plataforma Menvo em conformidade com a LGPD.",
      url: `https://www.menvo.com.br${path}`,
      siteName: "Menvo",
      locale
    }
  }
}

export default function PrivacyLayout({
  children
}: {
  children: React.ReactNode
}) {
  return children
}
