import { Metadata } from "next"
import { getTranslations } from "next-intl/server"

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "common" })
  const tDonate = await getTranslations({ locale, namespace: "donate" })

  const title = t("donate") || "Apoie o Menvo"
  const description = tDonate("hero.subtitle") || "Apoie a mentoria gratuita no Brasil. Sua doação via PIX mantém nossa plataforma e infraestrutura no ar."
  const path = locale === "pt-BR" ? "/doar" : `/${locale}/doar`
  const url = `https://www.menvo.com.br${path}`

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "pt-BR": "/doar",
        en: "/en/doar",
        es: "/es/doar"
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

export default function DoarLayout({ children }: { children: React.ReactNode }) {
  return children
}
