import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/header"
import { Footer } from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import { GoogleAnalytics } from "@/utils/google-analytics"
import { AppProviders } from "./providers"
import { WarningBanner } from "@/components/WarningBanner"
import { FeedbackBanner } from "@/components/FeedbackBanner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MentorConnect",
  description: "Plataforma de mentoria voluntária para conectar mentores e mentees.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <GoogleAnalytics />
        <AppProviders>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex min-h-screen flex-col">
              <WarningBanner />
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <Toaster />
              <FeedbackBanner />
            </div>
          </ThemeProvider>
        </AppProviders>
      </body>
    </html>
  )
}
