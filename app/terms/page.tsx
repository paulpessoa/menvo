"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from 'lucide-react'
import { Separator } from "@/components/ui/separator"
import { useTranslation } from "react-i18next"

export default function TermsOfServicePage() {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <FileText className="mx-auto h-16 w-16 text-primary mb-4" />
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            {t('terms.title')}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t('terms.lastUpdated')}
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('terms.introduction.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('terms.introduction.paragraph1')}
            </p>
            <p className="text-muted-foreground mt-4">
              {t('terms.introduction.paragraph2')}
            </p>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('terms.acceptance.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('terms.acceptance.description')}
            </p>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('terms.userAccounts.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{t('terms.userAccounts.item1')}</li>
              <li>{t('terms.userAccounts.item2')}</li>
              <li>{t('terms.userAccounts.item3')}</li>
            </ul>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('terms.userConduct.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {t('terms.userConduct.description')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{t('terms.userConduct.item1')}</li>
              <li>{t('terms.userConduct.item2')}</li>
              <li>{t('terms.userConduct.item3')}</li>
              <li>{t('terms.userConduct.item4')}</li>
            </ul>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('terms.mentorshipDisclaimer.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('terms.mentorshipDisclaimer.description')}
            </p>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('terms.intellectualProperty.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('terms.intellectualProperty.description')}
            </p>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('terms.termination.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('terms.termination.description')}
            </p>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('terms.disclaimerOfWarranties.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('terms.disclaimerOfWarranties.description')}
            </p>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('terms.limitationOfLiability.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('terms.limitationOfLiability.description')}
            </p>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('terms.changesToTerms.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('terms.changesToTerms.description')}
            </p>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">
            {t('terms.contactUs.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {t('terms.contactUs.description')}
          </p>
          <Link href="/about" passHref>
            <Button size="lg" variant="outline">
              {t('terms.contactUs.button')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
