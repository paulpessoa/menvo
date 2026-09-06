import { Metadata } from "next"
import { getTranslations } from "next-intl/server"

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "onboarding" })

  const title = t("title") || "Boas-vindas à Menvo"
  const description = t("description") || "Escolha seu perfil na Menvo: Mentorado ou Mentor voluntário e personalize sua jornada."
  const path = locale === "pt-BR" ? "/onboarding" : `/${locale}/onboarding`
  const url = `https://www.menvo.com.br${path}`

  return {
    title: `${title} | Menvo`,
    description,
    alternates: {
      canonical: url,
      languages: {
        "pt-BR": "/onboarding",
        en: "/en/onboarding",
        es: "/es/onboarding"
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

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children
}
