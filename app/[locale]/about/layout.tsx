import { getTranslations } from "next-intl/server"

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "about" })

  return {
    title: t("title") || "Sobre Nós",
    description: t("description") || t("ourMission.description"),
    alternates: {
      canonical: locale === "pt-BR" ? "/about" : `/${locale}/about`
    }
  }
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
