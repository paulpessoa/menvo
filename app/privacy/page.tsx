"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck } from 'lucide-react'
import { Separator } from "@/components/ui/separator"
import { useTranslation } from "react-i18next"

export default function PrivacyPolicyPage() {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <ShieldCheck className="mx-auto h-16 w-16 text-primary mb-4" />
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            {t('privacy.title')}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t('privacy.lastUpdated')}
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('privacy.introduction.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('privacy.introduction.paragraph1')}
            </p>
            <p className="text-muted-foreground mt-4">
              {t('privacy.introduction.paragraph2')}
            </p>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('privacy.informationWeCollect.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4 text-muted-foreground">
              <li>
                <h3 className="font-semibold text-lg mb-1">{t('privacy.informationWeCollect.direct.title')}</h3>
                <p>{t('privacy.informationWeCollect.direct.description')}</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>{t('privacy.informationWeCollect.direct.item1')}</li>
                  <li>{t('privacy.informationWeCollect.direct.item2')}</li>
                  <li>{t('privacy.informationWeCollect.direct.item3')}</li>
                  <li>{t('privacy.informationWeCollect.direct.item4')}</li>
                </ul>
              </li>
              <li>
                <h3 className="font-semibold text-lg mb-1">{t('privacy.informationWeCollect.automatic.title')}</h3>
                <p>{t('privacy.informationWeCollect.automatic.description')}</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>{t('privacy.informationWeCollect.automatic.item1')}</li>
                  <li>{t('privacy.informationWeCollect.automatic.item2')}</li>
                  <li>{t('privacy.informationWeCollect.automatic.item3')}</li>
                </ul>
              </li>
              <li>
                <h3 className="font-semibold text-lg mb-1">{t('privacy.informationWeCollect.thirdParty.title')}</h3>
                <p>{t('privacy.informationWeCollect.thirdParty.description')}</p>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('privacy.howWeUseInformation.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{t('privacy.howWeUseInformation.item1')}</li>
              <li>{t('privacy.howWeUseInformation.item2')}</li>
              <li>{t('privacy.howWeUseInformation.item3')}</li>
              <li>{t('privacy.howWeUseInformation.item4')}</li>
              <li>{t('privacy.howWeUseInformation.item5')}</li>
              <li>{t('privacy.howWeUseInformation.item6')}</li>
            </ul>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('privacy.howWeShareInformation.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{t('privacy.howWeShareInformation.item1')}</li>
              <li>{t('privacy.howWeShareInformation.item2')}</li>
              <li>{t('privacy.howWeShareInformation.item3')}</li>
              <li>{t('privacy.howWeShareInformation.item4')}</li>
            </ul>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('privacy.yourRights.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{t('privacy.yourRights.item1')}</li>
              <li>{t('privacy.yourRights.item2')}</li>
              <li>{t('privacy.yourRights.item3')}</li>
              <li>{t('privacy.yourRights.item4')}</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              {t('privacy.yourRights.contactInfo')}
            </p>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('privacy.dataSecurity.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('privacy.dataSecurity.description')}
            </p>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('privacy.changesToPolicy.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('privacy.changesToPolicy.description')}
            </p>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">
            {t('privacy.contactUs.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {t('privacy.contactUs.description')}
          </p>
          <Link href="/about" passHref>
            <Button size="lg" variant="outline">
              {t('privacy.contactUs.button')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
