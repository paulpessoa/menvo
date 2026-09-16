import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "common" })

  const path = locale === "pt-BR" ? "/how-it-works" : `/${locale}/how-it-works`
  const title = `${t("howItWorks") || "Como Funciona"} | Menvo`
  const description =
    "Entenda como funciona a plataforma Menvo para mentores e mentorados. Conexões gratuitas de desenvolvimento profissional."

  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: {
        "pt-BR": "/how-it-works",
        en: "/en/how-it-works",
        es: "/es/how-it-works"
      }
    },
    openGraph: {
      title,
      description,
      url: `https://www.menvo.com.br${path}`,
      siteName: "Menvo",
      locale
    }
  }
}

export default function HowItWorksLayout({
  children
}: {
  children: React.ReactNode
}) {
  return children
}
