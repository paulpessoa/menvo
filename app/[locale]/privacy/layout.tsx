import { Metadata } from "next"
import { getTranslations } from "next-intl/server"

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "privacy" })

  const title = t("title") || "Política de Privacidade"
  const description = t("intro") || "Saiba como o Menvo protege suas informações pessoais e assegura a privacidade em todas as interações."
  const path = locale === "pt-BR" ? "/privacy" : `/${locale}/privacy`
  const url = `https://www.menvo.com.br${path}`

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "pt-BR": "/privacy",
        en: "/en/privacy",
        es: "/es/privacy"
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

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}
