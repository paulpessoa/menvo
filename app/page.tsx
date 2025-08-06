'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ArrowRightIcon, LightbulbIcon, HandshakeIcon, UsersIcon, CalendarDaysIcon, StarIcon, CheckCircleIcon } from 'lucide-react'
import { NewsletterModal } from '@/components/newsletter/NewsletterModal'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useUserRoles } from '@/app/context/user-roles-context'

export default function HomePage() {
  const { t } = useTranslation()
  const [isNewsletterModalOpen, setIsNewsletterModalOpen] = useState(false)
  const { isAuthenticated, isMentor, isMentee, isLoading: authLoading } = useAuth()
  const { isLoadingRoles } = useUserRoles()

  const handleOpenNewsletterModal = () => {
    setIsNewsletterModalOpen(true)
  }

  const handleCloseNewsletterModal = () => {
    setIsNewsletterModalOpen(false)
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-r from-primary to-primary-foreground text-primary-foreground overflow-hidden">
        <div className="container px-4 md:px-6 flex flex-col items-center text-center relative z-10">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
              {t('home.hero.title')}
            </h1>
            <p className="mx-auto max-w-[700px] text-lg md:text-xl">
              {t('home.hero.subtitle')}
            </p>
          </div>
          <div className="space-x-4 mt-8">
            <Link href="/mentors" passHref>
              <Button variant="secondary" size="lg" className="text-primary">
                {t('home.hero.findMentorsButton')}
              </Button>
            </Link>
            <Link href="/signup" passHref>
              <Button variant="outline" size="lg" className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary">
                {t('home.hero.becomeMentorButton')}
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/menvopeople.jpg"
            alt="Hero Background"
            layout="fill"
            objectFit="cover"
            quality={80}
            className="opacity-30"
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                {t('home.howItWorks.title')}
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                {t('home.howItWorks.subtitle')}
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 sm:grid-cols-2 lg:grid-cols-3">
            <div className="grid gap-1">
              <div className="flex items-center justify-center rounded-full bg-primary p-3 text-primary-foreground w-12 h-12 mb-2">
                <UsersIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">{t('home.howItWorks.step1.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('home.howItWorks.step1.description')}
              </p>
            </div>
            <div className="grid gap-1">
              <div className="flex items-center justify-center rounded-full bg-primary p-3 text-primary-foreground w-12 h-12 mb-2">
                <LightbulbIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">{t('home.howItWorks.step2.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('home.howItWorks.step2.description')}
              </p>
            </div>
            <div className="grid gap-1">
              <div className="flex items-center justify-center rounded-full bg-primary p-3 text-primary-foreground w-12 h-12 mb-2">
                <HandshakeIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">{t('home.howItWorks.step3.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('home.howItWorks.step3.description')}
              </p>
            </div>
          </div>
          <div className="flex justify-center">
            <Link href="/how-it-works" passHref>
              <Button variant="outline" size="lg">
                {t('home.howItWorks.learnMoreButton')} <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                {t('home.whyChooseUs.title')}
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                {t('home.whyChooseUs.subtitle')}
              </p>
              <ul className="grid gap-4 py-4">
                <li>
                  <CheckCircleIcon className="mr-2 inline-block h-5 w-5 text-primary" />
                  <span className="font-medium">{t('home.whyChooseUs.feature1.title')}:</span>{' '}
                  {t('home.whyChooseUs.feature1.description')}
                </li>
                <li>
                  <CheckCircleIcon className="mr-2 inline-block h-5 w-5 text-primary" />
                  <span className="font-medium">{t('home.whyChooseUs.feature2.title')}:</span>{' '}
                  {t('home.whyChooseUs.feature2.description')}
                </li>
                <li>
                  <CheckCircleIcon className="mr-2 inline-block h-5 w-5 text-primary" />
                  <span className="font-medium">{t('home.whyChooseUs.feature3.title')}:</span>{' '}
                  {t('home.whyChooseUs.feature3.description')}
                </li>
              </ul>
            </div>
            <div className="flex flex-col items-center justify-center">
              <Image
                src="/images/online_presentation_monochromatic.png"
                width={500}
                height={500}
                alt="Why Choose Us"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                {t('home.testimonials.title')}
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                {t('home.testimonials.subtitle')}
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Avatar className="h-12 w-12 mr-4">
                    <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold">{t('home.testimonials.testimonial1.author')}</h4>
                    <p className="text-sm text-muted-foreground">{t('home.testimonials.testimonial1.role')}</p>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  {t('home.testimonials.testimonial1.quote')}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Avatar className="h-12 w-12 mr-4">
                    <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
                    <AvatarFallback>AS</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold">{t('home.testimonials.testimonial2.author')}</h4>
                    <p className="text-sm text-muted-foreground">{t('home.testimonials.testimonial2.role')}</p>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  {t('home.testimonials.testimonial2.quote')}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Avatar className="h-12 w-12 mr-4">
                    <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
                    <AvatarFallback>MS</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold">{t('home.testimonials.testimonial3.author')}</h4>
                    <p className="text-sm text-muted-foreground">{t('home.testimonials.testimonial3.role')}</p>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  {t('home.testimonials.testimonial3.quote')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 text-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              {t('home.callToAction.title')}
            </h2>
            <p className="mx-auto max-w-[700px] text-lg md:text-xl">
              {t('home.callToAction.subtitle')}
            </p>
          </div>
          <div className="mt-8">
            <Button variant="secondary" size="lg" onClick={handleOpenNewsletterModal}>
              {t('home.callToAction.button')}
            </Button>
          </div>
        </div>
      </section>

      <NewsletterModal isOpen={isNewsletterModalOpen} onClose={handleCloseNewsletterModal} />
    </div>
  )
}
