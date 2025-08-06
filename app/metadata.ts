import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "MentorConnect",
    template: "%s | MentorConnect",
  },
  description: "Plataforma de mentoria voluntária para conectar mentores e mentees.",
  keywords: [
    "mentoria",
    "voluntariado",
    "desenvolvimento profissional",
    "carreira",
    "aprendizado",
    "mentores",
    "mentees",
    "comunidade",
    "tecnologia",
    "impacto social",
  ],
  authors: [{ name: "Paul Pessoa", url: "https://github.com/paulpessoa" }],
  creator: "Paul Pessoa",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://www.mentorconnect.com.br", // Replace with your actual domain
    title: "MentorConnect",
    description: "Plataforma de mentoria voluntária para conectar mentores e mentees.",
    siteName: "MentorConnect",
    images: [
      {
        url: "/images/og-image.jpg", // Replace with your actual OG image
        width: 1200,
        height: 630,
        alt: "MentorConnect - Conectando Pessoas, Transformando Carreiras",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MentorConnect",
    description: "Plataforma de mentoria voluntária para conectar mentores e mentees.",
    images: ["/images/og-image.jpg"], // Replace with your actual Twitter image
    creator: "@yourtwitterhandle", // Replace with your Twitter handle
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
}
