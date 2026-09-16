import type { Metadata } from "next"

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const path = locale === "pt-BR" ? "/community" : `/${locale}/community`

  return {
    title: "Comunidade de Mentorados | Menvo",
    description:
      "Conheça outros mentorados na plataforma Menvo, troque experiências, faça networking e construa conexões de desenvolvimento profissional.",
    alternates: {
      canonical: path,
      languages: {
        "pt-BR": "/community",
        en: "/en/community",
        es: "/es/community"
      }
    },
    openGraph: {
      title: "Comunidade de Mentorados | Menvo",
      description:
        "Conheça outros mentorados na plataforma Menvo, troque experiências e faça networking profissional.",
      url: `https://www.menvo.com.br${path}`,
      siteName: "Menvo",
      locale
    }
  }
}

export default function CommunityLayout({
  children
}: {
  children: React.ReactNode
}) {
  return children
}
