import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "about" })

  const path = locale === "pt-BR" ? "/about" : `/${locale}/about`
  const title = "Sobre Nós | Menvo"
  const description =
    t("ourMission.description") ||
    "Conheça a missão da Menvo de democratizar o acesso à mentoria voluntária e gratuita de carreira."

  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: {
        "pt-BR": "/about",
        en: "/en/about",
        es: "/es/about"
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

export default function AboutLayout({
  children
}: {
  children: React.ReactNode
}) {
  return children
}
