import { Metadata } from "next"
import { getTranslations } from "next-intl/server"

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "terms" })

  const title = t("title") || "Termos de Serviço"
  const description = t("intro") || "Confira os termos e condições de uso da plataforma comunitária de mentoria gratuita Menvo."
  const path = locale === "pt-BR" ? "/terms" : `/${locale}/terms`
  const url = `https://www.menvo.com.br${path}`

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "pt-BR": "/terms",
        en: "/en/terms",
        es: "/es/terms"
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

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
