import type { Metadata } from 'next'

export const siteMetadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'Menvo - Plataforma de Mentoria Voluntária',
    template: '%s | Menvo',
  },
  description: 'Conectando mentores e mentees para crescimento pessoal e profissional.',
  keywords: [
    'mentoria',
    'voluntariado',
    'desenvolvimento pessoal',
    'desenvolvimento profissional',
    'carreira',
    'aprendizado',
    'comunidade',
    'impacto social',
    'startup',
    'tecnologia',
    'educação',
  ],
  openGraph: {
    title: 'Menvo - Plataforma de Mentoria Voluntária',
    description: 'Conectando mentores e mentees para crescimento pessoal e profissional.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    siteName: 'Menvo',
    images: [
      {
        url: '/images/menvoprint.png', // Replace with your actual OG image
        width: 1200,
        height: 630,
        alt: 'Menvo - Plataforma de Mentoria Voluntária',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Menvo - Plataforma de Mentoria Voluntária',
    description: 'Conectando mentores e mentees para crescimento pessoal e profissional.',
    images: ['/images/menvoprint.png'], // Replace with your actual Twitter image
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
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/logo192.png',
  },
  manifest: '/site.webmanifest',
}
