import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import Header from "@/components/header"
import { Toaster } from "@/components/ui/toaster"
import Footer from "@/components/footer"
import { FeedbackBanner } from "@/components/FeedbackBanner"
import { CookieConsentBanner } from "@/components/cookie-consent-banner"
import { GoogleAnalytics } from "@next/third-parties/google"
import Script from "next/script"
import { NextIntlClientProvider } from "next-intl"
import { getMessages, getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import { routing } from "@/i18n/routing"
import { ConsoleEasterEgg } from "@/components/ConsoleEasterEgg"
import { DebugUrlCapturer } from "@/components/DebugUrlCapturer"
import { MaintenanceGuard } from "@/components/MaintenanceGuard"
import { Suspense } from "react"

const inter = Inter({ subsets: ["latin"], display: "swap" })

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata" })

  return {
    metadataBase: new URL("https://www.menvo.com.br"),
    title: {
      default: t("title") || "Menvo",
      template: `%s | ${t("title") || "Menvo"}`
    },
    description:
      t("description") ||
      "Conectando mentores e mentees para sessões de mentoria gratuitas",
    authors: [{ name: "Paul Pessoa", url: "https://github.com/paulpessoa" }],
    creator: "Paul Pessoa",
    publisher: "MENVO",
    keywords: t.raw("keywords") || ["mentoria", "voluntariado"],
    openGraph: {
      type: "website",
      locale: locale,
      url: "https://www.menvo.com.br",
      title: t("og.title") || t("title"),
      description: t("og.description") || t("description"),
      siteName: t("og.siteName") || "MENVO"
    },
    twitter: {
      card: "summary_large_image",
      title: t("twitter.title") || t("title"),
      description: t("twitter.description") || t("description"),
      creator: "@paulpessoa"
    },
    robots: {
      index: true,
      follow: true
    },
    alternates: {
      languages: {
        "pt-BR": "/",
        en: "/en",
        es: "/es"
      }
    }
  }
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  const messages = await getMessages()

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.menvo.com.br/#organization",
        "name": "Menvo",
        "url": "https://www.menvo.com.br",
        "logo": "https://www.menvo.com.br/icon-512x512.png",
        "description":
          "Plataforma gratuita conectando pessoas a mentorias voluntárias de carreira e desenvolvimento profissional.",
        "sameAs": ["https://github.com/paulpessoa"]
      },
      {
        "@type": "WebSite",
        "@id": "https://www.menvo.com.br/#website",
        "url": "https://www.menvo.com.br",
        "name": "Menvo",
        "publisher": {
          "@id": "https://www.menvo.com.br/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://www.menvo.com.br/mentors?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      }
    ]
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/site.webmanifest" />
        <Script
          id="clarity-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "rz28fusa38");`
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Pular para o conteúdo principal
        </a>
        <Suspense fallback={null}>
          <DebugUrlCapturer />
        </Suspense>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <div className="flex min-h-screen flex-col">
              <ConsoleEasterEgg />
              <Header />
              <main id="main-content" className="flex-1">
                <MaintenanceGuard>
                  {children}
                </MaintenanceGuard>
              </main>
              <Footer />
              <FeedbackBanner />
              <CookieConsentBanner />
              <GoogleAnalytics gaId="G-Y2ETF2ENBD" />
            </div>
            <Toaster />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
