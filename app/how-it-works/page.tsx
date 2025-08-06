'use client'

import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CheckCircleIcon, SearchIcon, CalendarDaysIcon, HandshakeIcon, UserPlusIcon, ShieldCheckIcon, LightbulbIcon, TrendingUpIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function HowItWorksPage() {
  const { t } = useTranslation()

  const steps = [
    {
      title: t('howItWorks.steps.step1.title'),
      description: t('howItWorks.steps.step1.description'),
      image: '/images/how-it-works/register-mentee.jpg',
      imageAlt: t('howItWorks.steps.step1.imageAlt'),
      icon: UserPlusIcon,
    },
    {
      title: t('howItWorks.steps.step2.title'),
      description: t('howItWorks.steps.step2.description'),
      image: '/images/how-it-works/find.jpg',
      imageAlt: t('howItWorks.steps.step2.imageAlt'),
      icon: SearchIcon,
    },
    {
      title: t('howItWorks.steps.step3.title'),
      description: t('howItWorks.steps.step3.description'),
      image: '/images/how-it-works/schedule.jpg',
      imageAlt: t('howItWorks.steps.step3.imageAlt'),
      icon: CalendarDaysIcon,
    },
    {
      title: t('howItWorks.steps.step4.title'),
      description: t('howItWorks.steps.step4.description'),
      image: '/images/how-it-works/grow-together.jpg',
      imageAlt: t('howItWorks.steps.step4.imageAlt'),
      icon: HandshakeIcon,
    },
  ]

  const mentorSteps = [
    {
      title: t('howItWorks.mentorSteps.step1.title'),
      description: t('howItWorks.mentorSteps.step1.description'),
      image: '/images/how-it-works/register-mentor.jpg',
      imageAlt: t('howItWorks.mentorSteps.step1.imageAlt'),
      icon: UserPlusIcon,
    },
    {
      title: t('howItWorks.mentorSteps.step2.title'),
      description: t('howItWorks.mentorSteps.step2.description'),
      image: '/images/how-it-works/verify.jpg',
      imageAlt: t('howItWorks.mentorSteps.step2.imageAlt'),
      icon: ShieldCheckIcon,
    },
    {
      title: t('howItWorks.mentorSteps.step3.title'),
      description: t('howItWorks.mentorSteps.step3.description'),
      image: '/images/how-it-works/availability.jpg',
      imageAlt: t('howItWorks.mentorSteps.step3.imageAlt'),
      icon: LightbulbIcon,
    },
    {
      title: t('howItWorks.mentorSteps.step4.title'),
      description: t('howItWorks.mentorSteps.step4.description'),
      image: '/images/how-it-works/grow.jpg',
      imageAlt: t('howItWorks.mentorSteps.step4.imageAlt'),
      icon: TrendingUpIcon,
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <section className="mb-12 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-50 mb-6">
          {t('howItWorks.title')}
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          {t('howItWorks.subtitle')}
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-4xl font-bold tracking-tight text-center mb-8">
          {t('howItWorks.forMentees.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <Card key={index} className="flex flex-col items-center text-center p-6">
              <div className="relative w-full h-40 mb-4 rounded-md overflow-hidden">
                <Image
                  src={step.image || "/placeholder.svg"}
                  alt={step.imageAlt}
                  layout="fill"
                  objectFit="cover"
                  className="transition-transform duration-500 hover:scale-105"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-center mb-3">
                  <step.icon className="h-8 w-8 text-primary mr-2" />
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                </div>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Separator className="my-12" />

      <section className="mb-12">
        <h2 className="text-4xl font-bold tracking-tight text-center mb-8">
          {t('howItWorks.forMentors.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {mentorSteps.map((step, index) => (
            <Card key={index} className="flex flex-col items-center text-center p-6">
              <div className="relative w-full h-40 mb-4 rounded-md overflow-hidden">
                <Image
                  src={step.image || "/placeholder.svg"}
                  alt={step.imageAlt}
                  layout="fill"
                  objectFit="cover"
                  className="transition-transform duration-500 hover:scale-105"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-center mb-3">
                  <step.icon className="h-8 w-8 text-primary mr-2" />
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                </div>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Separator className="my-12" />

      <section className="mb-12 text-center">
        <h2 className="text-4xl font-bold tracking-tight mb-8">
          {t('howItWorks.ourCommitment.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="p-6">
            <CardHeader>
              <CheckCircleIcon className="h-10 w-10 text-green-500 mb-3 mx-auto" />
              <CardTitle className="text-xl font-semibold">{t('howItWorks.ourCommitment.commitment1.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{t('howItWorks.ourCommitment.commitment1.description')}</CardDescription>
            </CardContent>
          </Card>
          <Card className="p-6">
            <CardHeader>
              <CheckCircleIcon className="h-10 w-10 text-green-500 mb-3 mx-auto" />
              <CardTitle className="text-xl font-semibold">{t('howItWorks.ourCommitment.commitment2.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{t('howItWorks.ourCommitment.commitment2.description')}</CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
