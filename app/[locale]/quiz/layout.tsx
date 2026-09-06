import { Metadata } from "next"
import { getTranslations } from "next-intl/server"

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "quiz" })

  const title = t("quiz_page.title") || "Quiz de Carreira & Match com Mentores"
  const description = t("quiz_page.subtitle") || "Responda nosso questionário e receba recomendações inteligentes de mentores voluntários para seu momento profissional."
  const path = locale === "pt-BR" ? "/quiz" : `/${locale}/quiz`
  const url = `https://www.menvo.com.br${path}`

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "pt-BR": "/quiz",
        en: "/en/quiz",
        es: "/es/quiz"
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

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return children
}
