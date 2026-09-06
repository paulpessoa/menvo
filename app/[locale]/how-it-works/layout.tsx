import { Metadata } from "next"
import { getTranslations } from "next-intl/server"

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "howItWorks" })

  const title = t("title") || "Como Funciona"
  const description = t("description") || "Conectamos mentores e pessoas em busca de orientação profissional em mentorias voluntárias e 100% gratuitas."
  const path = locale === "pt-BR" ? "/how-it-works" : `/${locale}/how-it-works`
  const url = `https://www.menvo.com.br${path}`

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "pt-BR": "/how-it-works",
        en: "/en/how-it-works",
        es: "/es/how-it-works"
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

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return children
}
