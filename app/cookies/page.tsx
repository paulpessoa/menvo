"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Cookie } from 'lucide-react'
import { Separator } from "@/components/ui/separator"
import { useTranslation } from "react-i18next"

export default function CookiesPage() {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <Cookie className="mx-auto h-16 w-16 text-primary mb-4" />
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            {t('cookies.title')}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t('cookies.description')}
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('cookies.whatAreCookies.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('cookies.whatAreCookies.paragraph1')}
            </p>
            <p className="text-muted-foreground mt-4">
              {t('cookies.whatAreCookies.paragraph2')}
            </p>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('cookies.howWeUseCookies.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4 text-muted-foreground">
              <li>
                <h3 className="font-semibold text-lg mb-1">{t('cookies.howWeUseCookies.essential.title')}</h3>
                <p>{t('cookies.howWeUseCookies.essential.description')}</p>
              </li>
              <li>
                <h3 className="font-semibold text-lg mb-1">{t('cookies.howWeUseCookies.performance.title')}</h3>
                <p>{t('cookies.howWeUseCookies.performance.description')}</p>
              </li>
              <li>
                <h3 className="font-semibold text-lg mb-1">{t('cookies.howWeUseCookies.functionality.title')}</h3>
                <p>{t('cookies.howWeUseCookies.functionality.description')}</p>
              </li>
              <li>
                <h3 className="font-semibold text-lg mb-1">{t('cookies.howWeUseCookies.advertising.title')}</h3>
                <p>{t('cookies.howWeUseCookies.advertising.description')}</p>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('cookies.yourChoices.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {t('cookies.yourChoices.paragraph1')}
            </p>
            <p className="text-muted-foreground">
              {t('cookies.yourChoices.paragraph2')}
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
              <li>{t('cookies.yourChoices.browserSettings')}</li>
              <li>{t('cookies.yourChoices.optOutNetworks')}</li>
            </ul>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('cookies.changesToPolicy.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('cookies.changesToPolicy.description')}
            </p>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">
            {t('cookies.contactUs.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {t('cookies.contactUs.description')}
          </p>
          <Link href="/about" passHref>
            <Button size="lg" variant="outline">
              {t('cookies.contactUs.button')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
