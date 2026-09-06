import { Metadata } from "next"
import { getTranslations } from "next-intl/server"

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "common" })

  const title = t("community") || "Mentorados & Comunidade"
  const description = locale === "en" 
    ? "Connect with mentees, mentors, and community members on Menvo. Discover career growth stories."
    : locale === "es"
    ? "Conéctate con mentorados, mentores y miembros de la comunidad Menvo. Descubre trayectorias de aprendizaje."
    : "Conecte-se com mentorados, mentores e membros da comunidade Menvo. Descubra trajetórias de aprendizado e crescimento."
  const path = locale === "pt-BR" ? "/community" : `/${locale}/community`
  const url = `https://www.menvo.com.br${path}`

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "pt-BR": "/community",
        en: "/en/community",
        es: "/es/community"
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

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return children
}
