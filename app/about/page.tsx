'use client'

import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useTranslation } from 'react-i18next'
import { Globe } from '@/components/globe'
import { Contributors } from '@/components/Contributors'
import { Partners } from '@/components/Partners'

export default function AboutPage() {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <section className="mb-12 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-50 mb-6">
          {t('about.title')}
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          {t('about.subtitle')}
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-12">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">{t('about.ourMission.title')}</h2>
          <p className="text-lg text-muted-foreground">
            {t('about.ourMission.description')}
          </p>
        </div>
        <div className="relative h-64 md:h-96 w-full rounded-lg overflow-hidden shadow-lg">
          <Image
            src="/images/about/menvo-team.png"
            alt={t('about.ourMission.imageAlt')}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-500 hover:scale-105"
          />
        </div>
      </section>

      <Separator className="my-12" />

      <section className="mb-12">
        <h2 className="text-4xl font-bold tracking-tight text-center mb-8">
          {t('about.ourValues.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 text-center">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">{t('about.ourValues.value1.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{t('about.ourValues.value1.description')}</CardDescription>
            </CardContent>
          </Card>
          <Card className="p-6 text-center">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">{t('about.ourValues.value2.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{t('about.ourValues.value2.description')}</CardDescription>
            </CardContent>
          </Card>
          <Card className="p-6 text-center">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">{t('about.ourValues.value3.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{t('about.ourValues.value3.description')}</CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="my-12" />

      <section className="mb-12 text-center">
        <h2 className="text-4xl font-bold tracking-tight mb-8">
          {t('about.globalImpact.title')}
        </h2>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
          {t('about.globalImpact.description')}
        </p>
        <div className="flex justify-center items-center gap-8 flex-wrap mb-12">
          <Image src="/images/SDG-4.svg" alt="SDG 4 Quality Education" width={100} height={100} />
          <Image src="/images/SDG-5.svg" alt="SDG 5 Gender Equality" width={100} height={100} />
          <Image src="/images/SDG-8.svg" alt="SDG 8 Decent Work and Economic Growth" width={100} height={100} />
          <Image src="/images/SDG-10.svg" alt="SDG 10 Reduced Inequalities" width={100} height={100} />
        </div>
        <div className="h-[400px] w-full">
          <Globe />
        </div>
      </section>

      <Separator className="my-12" />

      <section className="mb-12">
        <h2 className="text-4xl font-bold tracking-tight text-center mb-8">
          {t('about.ourTeam.title')}
        </h2>
        <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-8">
          {t('about.ourTeam.description')}
        </p>
        <Contributors />
      </section>

      <Separator className="my-12" />

      <section className="mb-12">
        <h2 className="text-4xl font-bold tracking-tight text-center mb-8">
          {t('about.partners.title')}
        </h2>
        <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-8">
          {t('about.partners.description')}
        </p>
        <Partners />
      </section>
    </div>
  )
}
