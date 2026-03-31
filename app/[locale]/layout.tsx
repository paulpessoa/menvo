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
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

const inter = Inter({ subsets: ["latin"] })

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });

  return {
    metadataBase: new URL('https://menvo.com.br'),
    title: {
      default: t('title') || 'Menvo',
      template: `%s | ${t('title') || 'Menvo'}`
    },
    description: t('welcome') || 'Conectando mentores e mentees',
    authors: [{ name: "Paul Pessoa", url: "https://github.com/paulpessoa" }],
    creator: "Paul Pessoa",
    publisher: "MENVO",
    openGraph: {
      type: "website",
      locale: locale,
      url: "https://menvo.com.br",
      title: t('title') || 'Menvo',
      description: t('welcome') || 'Conectando mentores e mentees',
      siteName: "MENVO",
    },
    twitter: {
      card: "summary_large_image",
      title: t('title') || 'Menvo',
      creator: "@paulpessoa",
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: '/',
      languages: {
        'pt-BR': '/pt-BR',
        'en': '/en',
        'es': '/es',
        'da': '/da',
        'fr': '/fr',
        'sv': '/sv'
      }
    }
  };
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

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
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
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
