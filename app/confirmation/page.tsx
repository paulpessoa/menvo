'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MailCheckIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function ConfirmationPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-950">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-1">
          <MailCheckIcon className="mx-auto h-16 w-16 text-green-500" />
          <CardTitle className="text-3xl font-bold">{t('confirmation.title')}</CardTitle>
          <CardDescription className="text-lg">
            {t('confirmation.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {t('confirmation.instructions')}
          </p>
          <div className="flex flex-col gap-2">
            <Link href="/login" passHref>
              <Button className="w-full">{t('confirmation.loginButton')}</Button>
            </Link>
            <Link href="/" passHref>
              <Button variant="outline" className="w-full">{t('confirmation.homeButton')}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
