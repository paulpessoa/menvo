import { getTranslations } from "next-intl/server"

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "how-it-works" })

  return {
    title: t("title") || "Como Funciona",
    description: t("description"),
    alternates: {
      canonical: locale === "pt-BR" ? "/how-it-works" : `/${locale}/how-it-works`
    }
  }
}

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return children
}
