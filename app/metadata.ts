import { Metadata } from 'next'

interface GenerateMetadataProps {
  params: {
    lang: string
  }
}

export async function generateMetadata({ params: { lang } }: GenerateMetadataProps): Promise<Metadata> {
  // Importar as traduções baseado no idioma
  const translations = await import(`@/i18n/translations/${lang}.json`).then(m => m.default)
  const t = translations.metadata

  return {
    metadataBase: new URL('https://menvo.com.br'),
    title: t.title,
    description: t.description,
    authors: [{ name: "Paul Pessoa", url: "https://github.com/paulpessoa" }],
    creator: "Paul Pessoa",
    publisher: "MENVO",
    keywords: t.keywords,
    openGraph: {
      type: "website",
      locale: lang === 'pt-BR' ? 'pt_BR' : lang,
      url: "https://menvo.com.br",
      title: t.og.title,
      description: t.og.description,
      siteName: t.og.siteName,
    },
    twitter: {
      card: "summary_large_image",
      title: t.twitter.title,
      description: t.twitter.description,
      creator: "@paulpessoa",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: "seu-codigo-de-verificacao-google",
    },
    alternates: {
      canonical: "https://menvo.com.br",
      languages: {
        'pt-BR': 'https://menvo.com.br/pt-BR',
        'en': 'https://menvo.com.br/en',
        'es': 'https://menvo.com.br/es',
      },
    },
  }
} 