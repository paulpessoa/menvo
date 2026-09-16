import type { Metadata } from "next"

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const path = locale === "pt-BR" ? "/faq" : `/${locale}/faq`

  return {
    title: "Perguntas Frequentes (FAQ) | Menvo",
    description:
      "Tire suas dúvidas sobre a plataforma Menvo: como agendar mentorias, ser mentor voluntário, requisitos e funcionamento.",
    alternates: {
      canonical: path,
      languages: {
        "pt-BR": "/faq",
        en: "/en/faq",
        es: "/es/faq"
      }
    },
    openGraph: {
      title: "Perguntas Frequentes (FAQ) | Menvo",
      description:
        "Tire suas dúvidas sobre a plataforma Menvo: como agendar mentorias, ser mentor voluntário, requisitos e funcionamento.",
      url: `https://www.menvo.com.br${path}`,
      siteName: "Menvo",
      locale
    }
  }
}

export default function FAQLayout({
  children
}: {
  children: React.ReactNode
}) {
  return children
}
