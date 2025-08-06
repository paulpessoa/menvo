import type { Metadata } from 'next'

export const siteConfig = {
  name: 'MentorConnect',
  description: 'Plataforma de mentoria voluntária para conectar mentores e mentees para crescimento pessoal e profissional.',
  url: 'https://mentorconnect.vercel.app', // Replace with your actual domain
  ogImage: 'https://mentorconnect.vercel.app/og-image.jpg', // Replace with your actual OG image
  links: {
    twitter: 'https://twitter.com/vercel', // Replace with your Twitter
    github: 'https://github.com/vercel/next.js', // Replace with your GitHub
  },
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    'mentoria',
    'voluntariado',
    'desenvolvimento pessoal',
    'desenvolvimento profissional',
    'carreira',
    'educação',
    'tecnologia',
    'startup',
    'impacto social',
  ],
  authors: [
    {
      name: 'MentorConnect Team',
      url: siteConfig.url,
    },
  ],
  creator: 'MentorConnect Team',
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
    creator: '@vercel', // Replace with your Twitter handle
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: `${siteConfig.url}/site.webmanifest`,
}
