import { getTranslations } from "next-intl/server"

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "common" })

  return {
    title: t("community"),
    alternates: {
      canonical: locale === "pt-BR" ? "/community" : `/${locale}/community`
    }
  }
}

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return children
}
