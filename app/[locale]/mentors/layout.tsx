import { Metadata } from "next"
import { getTranslations } from "next-intl/server"

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "common" })
  const tMentors = await getTranslations({ locale, namespace: "mentorsPage" })

  const title = t("findMentors") || "Encontrar Mentores"
  const description = tMentors("subtitle") || "Explore nossa comunidade de mentores experientes e acelere sua carreira com mentorias voluntárias e gratuitas."
  const path = locale === "pt-BR" ? "/mentors" : `/${locale}/mentors`
  const url = `https://www.menvo.com.br${path}`

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "pt-BR": "/mentors",
        en: "/en/mentors",
        es: "/es/mentors"
      }
    },
    openGraph: {
      title: `${title} | Menvo`,
      description,
      url,
      siteName: "Menvo",
      locale,
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Menvo`,
      description
    }
  }
}

export default function MentorsLayout({ children }: { children: React.ReactNode }) {
  return children
}
