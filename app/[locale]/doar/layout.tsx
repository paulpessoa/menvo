import { getTranslations } from "next-intl/server"

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "common" })

  return {
    title: t("donate"),
    alternates: {
      canonical: locale === "pt-BR" ? "/doar" : `/${locale}/doar`
    }
  }
}

export default function DoarLayout({ children }: { children: React.ReactNode }) {
  return children
}
