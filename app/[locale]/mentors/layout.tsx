import { getTranslations } from "next-intl/server"

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "common" })

  return {
    title: t("findMentors"),
    alternates: {
      canonical: locale === "pt-BR" ? "/mentors" : `/${locale}/mentors`
    }
  }
}

export default function MentorsLayout({ children }: { children: React.ReactNode }) {
  return children
}
