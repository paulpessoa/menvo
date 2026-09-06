import { Metadata } from "next"
import { getTranslations } from "next-intl/server"

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "faq" })

  const title = t("title") || "Perguntas Frequentes"
  const description = t("description") || "Tire suas dúvidas sobre como funciona o Menvo, agendamento de mentorias, voluntariado e impacto social."
  const path = locale === "pt-BR" ? "/faq" : `/${locale}/faq`
  const url = `https://www.menvo.com.br${path}`

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "pt-BR": "/faq",
        en: "/en/faq",
        es: "/es/faq"
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

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return children
}
