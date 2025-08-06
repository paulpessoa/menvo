'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2Icon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/use-toast'
import { useTranslation } from 'react-i18next'

export default function AuthPage() {
  const { t } = useTranslation()
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard')
      } else {
        router.push('/login')
        toast({
          title: t('authPage.redirectLoginTitle'),
          description: t('authPage.redirectLoginDescription'),
          variant: 'default',
        })
      }
    }
  }, [isAuthenticated, isLoading, router, toast, t])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-950">
      <div className="flex flex-col items-center space-y-4">
        <Loader2Icon className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">{t('authPage.loadingMessage')}</p>
      </div>
    </div>
  )
}
