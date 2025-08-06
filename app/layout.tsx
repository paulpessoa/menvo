import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { GoogleAnalytics } from '@/utils/google-analytics'
import { AuthProvider } from '@/hooks/useAuth'
import { UserRolesProvider } from './context/user-roles-context'
import { QueryClientProviderWrapper } from '@/app/providers'
import { i18nConfig } from '@/i18n/config'
import { dir } from 'i18next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mentor Connect',
  description: 'Plataforma de mentoria para conectar mentees e mentores.',
    generator: 'v0.dev'
}

export function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

export default function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  return (
    <html lang={locale} dir={dir(locale)} suppressHydrationWarning>
      <body className={inter.className}>
        {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS ? (
          <GoogleAnalytics ga_id={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS} />
        ) : null}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryClientProviderWrapper>
            <AuthProvider>
              <UserRolesProvider>
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-grow">
                    {children}
                  </main>
                  <Footer />
                </div>
                <Toaster />
              </UserRolesProvider>
            </AuthProvider>
          </QueryClientProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}
