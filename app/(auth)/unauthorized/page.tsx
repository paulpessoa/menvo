'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldOffIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function UnauthorizedPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-950">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-1">
          <ShieldOffIcon className="mx-auto h-16 w-16 text-red-500" />
          <CardTitle className="text-3xl font-bold">{t('unauthorized.title')}</CardTitle>
          <CardDescription className="text-lg">
            {t('unauthorized.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {t('unauthorized.message')}
          </p>
          <div className="flex flex-col gap-2">
            <Link href="/login" passHref>
              <Button className="w-full">{t('unauthorized.loginButton')}</Button>
            </Link>
            <Link href="/" passHref>
              <Button variant="outline" className="w-full">{t('unauthorized.homeButton')}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
