import type { Metadata } from 'next'

export const siteConfig = {
  name: 'Mentor Connect',
  description: 'Plataforma de mentoria para conectar mentees e mentores.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  ogImage: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/og-image.jpg`,
  links: {
    twitter: 'https://twitter.com/yourhandle',
    github: 'https://github.com/yourorg/mentor-connect',
  },
}

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    'mentoria',
    'mentor',
    'mentee',
    'desenvolvimento profissional',
    'aprendizado',
    'comunidade',
    'tecnologia',
    'carreira',
  ],
  authors: [
    {
      name: 'Mentor Connect Team',
      url: siteConfig.url,
    },
  ],
  creator: 'Mentor Connect Team',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: siteConfig.links.twitter,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: `${siteConfig.url}/site.webmanifest`,
}
