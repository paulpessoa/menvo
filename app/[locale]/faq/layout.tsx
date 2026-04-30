import { getTranslations } from "next-intl/server"

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "faq" })

  return {
    title: t("title") || "FAQ",
    description: t("description"),
    alternates: {
      canonical: locale === "pt-BR" ? "/faq" : `/${locale}/faq`
    }
  }
}

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return children
}
