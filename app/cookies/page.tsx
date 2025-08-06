'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CookieIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function CookiesPage() {
  const { t } = useTranslation()

  const handleAcceptCookies = () => {
    // In a real application, you would set a cookie here
    // For example: localStorage.setItem('cookiesAccepted', 'true');
    // And then hide a cookie banner or redirect.
    alert(t('cookiesPage.acceptAlert'))
  }

  const handleDeclineCookies = () => {
    // In a real application, you would set a cookie here to remember the decline
    // and potentially disable non-essential cookies.
    alert(t('cookiesPage.declineAlert'))
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="text-center space-y-1">
          <CookieIcon className="mx-auto h-16 w-16 text-primary" />
          <CardTitle className="text-3xl font-bold">{t('cookiesPage.title')}</CardTitle>
          <CardDescription className="text-lg">
            {t('cookiesPage.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('cookiesPage.whatAreCookies.title')}</h2>
            <p className="text-muted-foreground">
              {t('cookiesPage.whatAreCookies.paragraph1')}
            </p>
            <p className="text-muted-foreground mt-2">
              {t('cookiesPage.whatAreCookies.paragraph2')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('cookiesPage.howWeUseCookies.title')}</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>{t('cookiesPage.howWeUseCookies.item1.title')}:</strong> {t('cookiesPage.howWeUseCookies.item1.description')}</li>
              <li><strong>{t('cookiesPage.howWeUseCookies.item2.title')}:</strong> {t('cookiesPage.howWeUseCookies.item2.description')}</li>
              <li><strong>{t('cookiesPage.howWeUseCookies.item3.title')}:</strong> {t('cookiesPage.howWeUseCookies.item3.description')}</li>
              <li><strong>{t('cookiesPage.howWeUseCookies.item4.title')}:</strong> {t('cookiesPage.howWeUseCookies.item4.description')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('cookiesPage.yourChoices.title')}</h2>
            <p className="text-muted-foreground mb-4">
              {t('cookiesPage.yourChoices.paragraph1')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleAcceptCookies} className="flex-1">
                {t('cookiesPage.yourChoices.acceptButton')}
              </Button>
              <Button onClick={handleDeclineCookies} variant="outline" className="flex-1">
                {t('cookiesPage.yourChoices.declineButton')}
              </Button>
            </div>
            <p className="text-muted-foreground text-sm mt-4">
              {t('cookiesPage.yourChoices.paragraph2')}
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
