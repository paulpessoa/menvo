"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Users, Lightbulb, Handshake, Goal, Heart, ArrowRight } from 'lucide-react'
import { Contributors } from "@/components/Contributors"
import { Partners } from "@/components/Partners"
import { useTranslation } from "react-i18next"

export default function AboutPage() {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          {t('about.hero.title')}
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          {t('about.hero.description')}
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/mentors" passHref>
            <Button size="lg">
              {t('about.hero.findMentors')} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/how-it-works" passHref>
            <Button size="lg" variant="outline">
              {t('about.hero.howItWorks')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <Card>
          <CardHeader>
            <Lightbulb className="h-8 w-8 text-primary mb-2" />
            <CardTitle>{t('about.mission.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('about.mission.description')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Goal className="h-8 w-8 text-primary mb-2" />
            <CardTitle>{t('about.vision.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('about.vision.description')}
            </p>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-16" />

      {/* Our Story */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          {t('about.ourStory.title')}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4 text-muted-foreground">
            <p>{t('about.ourStory.paragraph1')}</p>
            <p>{t('about.ourStory.paragraph2')}</p>
            <p>{t('about.ourStory.paragraph3')}</p>
          </div>
          <div className="relative h-64 w-full md:h-96 rounded-lg overflow-hidden shadow-lg">
            <Image
              src="/images/about/menvo-team.png"
              alt="Menvo Team"
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
            />
          </div>
        </div>
      </section>

      <Separator className="my-16" />

      {/* Our Values */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          {t('about.ourValues.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardHeader>
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle>{t('about.ourValues.community.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t('about.ourValues.community.description')}
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <Handshake className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle>{t('about.ourValues.collaboration.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t('about.ourValues.collaboration.description')}
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <Heart className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle>{t('about.ourValues.impact.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t('about.ourValues.impact.description')}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="my-16" />

      {/* Contributors Section */}
      <Contributors />

      <Separator className="my-16" />

      {/* Partners Section */}
      <Partners />

      {/* Call to Action */}
      <section className="text-center mt-16">
        <h2 className="text-3xl font-bold mb-4">
          {t('about.cta.title')}
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          {t('about.cta.description')}
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/signup" passHref>
            <Button size="lg">
              {t('about.cta.becomeMentor')} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/doar" passHref>
            <Button size="lg" variant="outline">
              {t('about.cta.supportUs')}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
