'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FrownIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-950">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-1">
          <FrownIcon className="mx-auto h-16 w-16 text-primary" />
          <CardTitle className="text-3xl font-bold">{t('notFound.title')}</CardTitle>
          <CardDescription className="text-lg">
            {t('notFound.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {t('notFound.message')}
          </p>
          <Link href="/" passHref>
            <Button className="w-full">{t('notFound.homeButton')}</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
