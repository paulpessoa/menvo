'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/hooks/useAuth'
import { GoogleAnalytics } from '@/utils/google-analytics'
import { ReactNode } from 'react'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        {children}
      </AuthProvider>
      <Toaster />
      {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS ? (
        <GoogleAnalytics ga_id={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS} />
      ) : null}
    </ThemeProvider>
  )
}
