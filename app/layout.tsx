import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Toaster } from '@/components/ui/toaster'
import { GoogleAnalytics } from '@/utils/google-analytics' // Corrected import
import { AuthProvider } from '@/hooks/useAuth'
import { UserRolesProvider } from '@/app/context/user-roles-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Menvo - Plataforma de Mentoria Voluntária',
  description: 'Conectando mentores e mentees para crescimento pessoal e profissional.',
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <UserRolesProvider>
              <Header />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
              <Toaster />
            </UserRolesProvider>
          </AuthProvider>
        </ThemeProvider>
        {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS} />
        )}
      </body>
    </html>
  )
}
