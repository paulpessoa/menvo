import type React from "react"
import type { Metadata } from "next"
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

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL("https://menvo.com.br"),
  title: "MENVO -  Mentores Voluntários",
  description:
    "Conectando mentores e mentees para sessões gratuitas de mentoria. Encontre mentores voluntários em tecnologia, carreira e desenvolvimento pessoal.",
  authors: [{ name: "Paul Pessoa", url: "https://github.com/paulpessoa" }],
  creator: "Paul Pessoa",
  publisher: "MENVO",
  keywords: [
    "mentoria",
    "mentores voluntários",
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
    "mentoria de carreira"
  ],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://menvo.com.br",
    title: "MENVO -  Mentores Voluntários",
    description:
      "Conectando mentores e mentees para sessões gratuitas de mentoria. Encontre mentores voluntários em tecnologia, carreira e desenvolvimento pessoal.",
    siteName: "MENVO",
    images: [
      {
        url: "https://menvo.com.br/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MENVO -  Mentores Voluntários"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "MENVO -  Mentores Voluntários",
    description:
      "Conectando mentores e mentees para sessões gratuitas de mentoria. Encontre mentores voluntários em tecnologia, carreira e desenvolvimento pessoal.",
    creator: "@paulpessoa",
    images: ["https://menvo.com.br/twitter-image.jpg"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  verification: {
    google: "QOvwcJxdEYfhUUNK-q-E5kcE-JMgWcUTTOUaZIf2M8k"
  },
  alternates: {
    canonical: "https://menvo.com.br"
  },
  category: "education",
  classification: "Platform",
  referrer: "origin-when-cross-origin",
  other: {
    "msapplication-TileColor": "#ffffff",
    "msapplication-TileImage": "/mstile-144x144.png",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "MENVO",
    "application-name": "MENVO",
    "format-detection": "telephone=no",
    "mobile-web-app-capable": "yes",
    "theme-color": "#ffffff"
  },
  generator: "v0.dev"
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <Script
          id="clarity-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              
              // Check for cookie consent before starting Clarity
              try {
                var consent = localStorage.getItem('cookie-consent');
                if (consent) {
                  var prefs = JSON.parse(consent);
                  // Send consent signal to Clarity
                  c[a]('consent', prefs.analytics || false);
                } else {
                  // Default to no consent until user makes a choice
                  c[a]('consent', false);
                }
              } catch(e) {
                console.error('[Clarity] Error checking consent:', e);
                c[a]('consent', false);
              }
            })(window, document, "clarity", "script", "rz28fusa38");`
          }}
        />
        <Script
          id="egoi-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if(window._mtmReady){
                console.error('Connected sites script already loaded. You might have it dupplicated.'); 
              } else {
                window._mtmReady = true;
                var _mtm = window._mtm = window._mtm || [];
                _mtm.push({'mtm.startTime': (new Date().getTime()), 'event': 'mtm.Start'});
                var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
                g.async=true; g.src='https://egoi.site/1777227_menvo.com.br.js?v='+new Date().getTime();
                s.parentNode.insertBefore(g,s);
              }
            `
          }}
        />
        <Script
          id="hotjar-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(h,o,t,j,a,r){
                  h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                  h._hjSettings={hjid:6496770,hjsv:6};
                  a=o.getElementsByTagName('head')[0];
                  r=o.createElement('script');r.async=1;
                  r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                  a.appendChild(r);
              })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
            `
          }}
        />

      </head>
      <body className={inter.className} suppressHydrationWarning>
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

        {/* Start of menvo Zendesk Widget script */}
        {/* <Script
          id="ze-snippet"
          src="https://static.zdassets.com/ekr/snippet.js?key=a3906e97-a348-41e5-abdb-4cccbcfa87a8"
          strategy="beforeInteractive"
        /> */}
        {/* End of menvo Zendesk Widget script */}
      </body>
    </html>
  )
}
export function generateViewport() {
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: "white" },
      { media: "(prefers-color-scheme: dark)", color: "black" }
    ]
  }
}
