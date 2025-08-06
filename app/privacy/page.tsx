'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from 'react-i18next'

export default function PrivacyPolicyPage() {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-3xl font-bold">{t('privacyPolicy.title')}</CardTitle>
          <CardDescription className="text-lg">
            {t('privacyPolicy.lastUpdated', { date: '2023-10-27' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('privacyPolicy.introduction.title')}</h2>
            <p>{t('privacyPolicy.introduction.paragraph1')}</p>
            <p className="mt-2">{t('privacyPolicy.introduction.paragraph2')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('privacyPolicy.informationWeCollect.title')}</h2>
            <p>{t('privacyPolicy.informationWeCollect.paragraph1')}</p>
            <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
              <li><strong>{t('privacyPolicy.informationWeCollect.item1.title')}:</strong> {t('privacyPolicy.informationWeCollect.item1.description')}</li>
              <li><strong>{t('privacyPolicy.informationWeCollect.item2.title')}:</strong> {t('privacyPolicy.informationWeCollect.item2.description')}</li>
              <li><strong>{t('privacyPolicy.informationWeCollect.item3.title')}:</strong> {t('privacyPolicy.informationWeCollect.item3.description')}</li>
              <li><strong>{t('privacyPolicy.informationWeCollect.item4.title')}:</strong> {t('privacyPolicy.informationWeCollect.item4.description')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('privacyPolicy.howWeUseInformation.title')}</h2>
            <p>{t('privacyPolicy.howWeUseInformation.paragraph1')}</p>
            <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
              <li>{t('privacyPolicy.howWeUseInformation.item1')}</li>
              <li>{t('privacyPolicy.howWeUseInformation.item2')}</li>
              <li>{t('privacyPolicy.howWeUseInformation.item3')}</li>
              <li>{t('privacyPolicy.howWeUseInformation.item4')}</li>
              <li>{t('privacyPolicy.howWeUseInformation.item5')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('privacyPolicy.informationSharing.title')}</h2>
            <p>{t('privacyPolicy.informationSharing.paragraph1')}</p>
            <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
              <li><strong>{t('privacyPolicy.informationSharing.item1.title')}:</strong> {t('privacyPolicy.informationSharing.item1.description')}</li>
              <li><strong>{t('privacyPolicy.informationSharing.item2.title')}:</strong> {t('privacyPolicy.informationSharing.item2.description')}</li>
              <li><strong>{t('privacyPolicy.informationSharing.item3.title')}:</strong> {t('privacyPolicy.informationSharing.item3.description')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('privacyPolicy.dataSecurity.title')}</h2>
            <p>{t('privacyPolicy.dataSecurity.paragraph1')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('privacyPolicy.yourRights.title')}</h2>
            <p>{t('privacyPolicy.yourRights.paragraph1')}</p>
            <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
              <li>{t('privacyPolicy.yourRights.item1')}</li>
              <li>{t('privacyPolicy.yourRights.item2')}</li>
              <li>{t('privacyPolicy.yourRights.item3')}</li>
              <li>{t('privacyPolicy.yourRights.item4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('privacyPolicy.changesToPolicy.title')}</h2>
            <p>{t('privacyPolicy.changesToPolicy.paragraph1')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('privacyPolicy.contactUs.title')}</h2>
            <p>{t('privacyPolicy.contactUs.paragraph1')}</p>
            <p className="mt-2">
              {t('privacyPolicy.contactUs.email')}: <a href="mailto:privacy@menvo.org" className="underline">privacy@menvo.org</a>
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
