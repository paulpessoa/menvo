import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "mentorsPage" })

  const path = locale === "pt-BR" ? "/mentors" : `/${locale}/mentors`

  return {
    title: t("title") || "Encontre seu Mentor Ideal | Menvo",
    description:
      t("subtitle") ||
      "Conecte-se com mentores voluntários e verificados para acelerar seu desenvolvimento de carreira. Sessões gratuitas.",
    alternates: {
      canonical: path,
      languages: {
        "pt-BR": "/mentors",
        en: "/en/mentors",
        es: "/es/mentors"
      }
    },
    openGraph: {
      title: `${t("title") || "Encontre seu Mentor Ideal"} | Menvo`,
      description:
        t("subtitle") ||
        "Conecte-se com mentores voluntários e verificados para acelerar seu desenvolvimento de carreira.",
      url: `https://www.menvo.com.br${path}`,
      siteName: "Menvo",
      locale
    }
  }
}

export default function MentorsLayout({
  children
}: {
  children: React.ReactNode
}) {
  return children
}
