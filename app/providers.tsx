'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/hooks/useAuth'
import { UserRolesProvider } from '@/app/context/user-roles-context'
import { Toaster } from '@/components/ui/toaster'
import { GoogleAnalytics } from '@/utils/google-analytics'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n/config' // Your i18n configuration
import { WarningBanner } from '@/components/WarningBanner'
import { FeedbackBanner } from '@/components/FeedbackBanner'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <UserRolesProvider>
            {children}
            <Toaster />
          </UserRolesProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nextProvider>
  )
}
