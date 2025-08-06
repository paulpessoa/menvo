"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, Users, Lightbulb, Handshake, Calendar, MessageSquare, Star, GlobeIcon, CheckCircle } from 'lucide-react'
import { WavyBackground } from "@/components/wavy-background"
import { Globe } from "@/components/globe"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/hooks/useAuth"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const { t } = useTranslation()
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full h-[calc(100vh-80px)] flex items-center justify-center text-center overflow-hidden">
        <WavyBackground className="absolute inset-0 z-0">
          <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white drop-shadow-lg mb-6">
              {t('home.hero.title')}
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mb-10">
              {t('home.hero.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/mentors" passHref>
                <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
                  {t('home.hero.findMentors')} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/signup" passHref>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20">
                  {t('home.hero.becomeMentor')}
                </Button>
              </Link>
            </div>
          </div>
        </WavyBackground>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          {t('home.howItWorks.title')}
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
          {t('home.howItWorks.description')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-6">
            <CardHeader>
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>{t('home.howItWorks.step1.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{t('home.howItWorks.step1.description')}</CardDescription>
            </CardContent>
          </Card>
          <Card className="p-6">
            <CardHeader>
              <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>{t('home.howItWorks.step2.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{t('home.howItWorks.step2.description')}</CardDescription>
            </CardContent>
          </Card>
          <Card className="p-6">
            <CardHeader>
              <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>{t('home.howItWorks.step3.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{t('home.howItWorks.step3.description')}</CardDescription>
            </CardContent>
          </Card>
        </div>
        <Link href="/how-it-works" passHref>
          <Button variant="outline" className="mt-12">
            {t('home.howItWorks.learnMore')} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </section>

      <Separator className="my-16" />

      {/* Why Choose Us Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-12">
          {t('home.whyChooseUs.title')}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">{t('home.whyChooseUs.reason1.title')}</h3>
                <p className="text-muted-foreground">{t('home.whyChooseUs.reason1.description')}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">{t('home.whyChooseUs.reason2.title')}</h3>
                <p className="text-muted-foreground">{t('home.whyChooseUs.reason2.description')}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">{t('home.whyChooseUs.reason3.title')}</h3>
                <p className="text-muted-foreground">{t('home.whyChooseUs.reason3.description')}</p>
              </div>
            </div>
          </div>
          <div className="relative h-64 md:h-96 w-full rounded-lg overflow-hidden shadow-xl">
            <Image
              src="/images/online_presentation_monochromatic.png"
              alt="Mentorship session"
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
            />
          </div>
        </div>
      </section>

      <Separator className="my-16" />

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          {t('home.testimonials.title')}
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
          {t('home.testimonials.description')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-6 text-left">
            <CardContent>
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-lg italic text-muted-foreground mb-4">
                "{t('home.testimonials.testimonial1.quote')}"
              </p>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="/placeholder-user.jpg" alt="João Silva" />
                  <AvatarFallback>JS</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{t('home.testimonials.testimonial1.author')}</p>
                  <p className="text-sm text-muted-foreground">{t('home.testimonials.testimonial1.role')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="p-6 text-left">
            <CardContent>
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-lg italic text-muted-foreground mb-4">
                "{t('home.testimonials.testimonial2.quote')}"
              </p>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="/placeholder-user.jpg" alt="Maria Souza" />
                  <AvatarFallback>MS</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{t('home.testimonials.testimonial2.author')}</p>
                  <p className="text-sm text-muted-foreground">{t('home.testimonials.testimonial2.role')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="my-16" />

      {/* Global Impact Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          {t('home.globalImpact.title')}
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
          {t('home.globalImpact.description')}
        </p>
        <div className="relative h-[400px] w-full max-w-4xl mx-auto">
          <Globe />
        </div>
      </section>

      <Separator className="my-16" />

      {/* Call to Action Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          {t('home.cta.title')}
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          {t('home.cta.description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup" passHref>
            <Button size="lg">
              {t('home.cta.joinNow')} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/doar" passHref>
            <Button size="lg" variant="outline">
              {t('home.cta.supportUs')}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
