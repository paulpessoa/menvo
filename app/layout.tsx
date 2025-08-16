import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import Header from "@/components/header"
import { Toaster } from "@/components/ui/toaster"
import Footer from "@/components/footer"
import { FeedbackBanner } from "@/components/FeedbackBanner"
import { GoogleAnalytics } from "@next/third-parties/google"
import Script from "next/script"
// import { AuthGuard } from "@/components/auth/AuthGuard"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL("https://menvo.com.br"),
  title: "MENVO - Plataforma de Mentoria Voluntária",
  description:
    "Conectando mentores e mentees para sessões gratuitas de mentoria. Encontre mentores voluntários em tecnologia, carreira e desenvolvimento pessoal.",
  authors: [{ name: "Paul Pessoa", url: "https://github.com/paulpessoa" }],
  creator: "Paul Pessoa",
  publisher: "MENVO",
  keywords: [
    "mentoria",
    "mentoria voluntária",
    "desenvolvimento profissional",
    "carreira",
    "aprendizado",
    "mentores",
    "mentorados",
    "educação",
    "desenvolvimento pessoal",
    "mentoria gratuita",
    "mentoria online",
    "mentoria em tecnologia",
    "mentoria de carreira",
  ],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://menvo.com.br",
    title: "MENVO - Plataforma de Mentoria Voluntária",
    description:
      "Conectando mentores e mentees para sessões gratuitas de mentoria. Encontre mentores voluntários em tecnologia, carreira e desenvolvimento pessoal.",
    siteName: "MENVO",
    images: [
      {
        url: "https://menvo.com.br/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MENVO - Plataforma de Mentoria Voluntária",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MENVO - Plataforma de Mentoria Voluntária",
    description:
      "Conectando mentores e mentees para sessões gratuitas de mentoria. Encontre mentores voluntários em tecnologia, carreira e desenvolvimento pessoal.",
    creator: "@paulpessoa",
    images: ["https://menvo.com.br/twitter-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "QOvwcJxdEYfhUUNK-q-E5kcE-JMgWcUTTOUaZIf2M8k",
  },
  alternates: {
    canonical: "https://menvo.com.br",
  },
  category: "education",
  classification: "Platform",
  referrer: "origin-when-cross-origin",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  other: {
    "msapplication-TileColor": "#ffffff",
    "msapplication-TileImage": "/mstile-144x144.png",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "MENVO",
    "application-name": "MENVO",
    "format-detection": "telephone=no",
    "mobile-web-app-capable": "yes",
    "theme-color": "#ffffff",
  },
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
        <Script
          id="clarity-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "rz28fusa38");`,
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers>
          {/* <AuthGuard> */}
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <FeedbackBanner />
            <GoogleAnalytics gaId="G-Y2ETF2ENBD" />
          </div>
          {/* </AuthGuard> */}
          <Toaster />
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}
