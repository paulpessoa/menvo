"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, UserPlus, Search, Calendar, MessageSquare, Award, Lightbulb, Users } from 'lucide-react'
import { useTranslation } from "react-i18next"

export default function HowItWorksPage() {
  const { t } = useTranslation()

  const steps = [
    {
      icon: <UserPlus className="h-8 w-8 text-primary" />,
      title: t('howItWorks.steps.register.title'),
      description: t('howItWorks.steps.register.description'),
      image: "/images/how-it-works/register-mentee.jpg",
      alt: "Register as mentee",
      link: "/signup",
      linkText: t('howItWorks.steps.register.linkText'),
    },
    {
      icon: <Search className="h-8 w-8 text-primary" />,
      title: t('howItWorks.steps.find.title'),
      description: t('howItWorks.steps.find.description'),
      image: "/images/how-it-works/find.jpg",
      alt: "Find mentors",
      link: "/mentors",
      linkText: t('howItWorks.steps.find.linkText'),
    },
    {
      icon: <Calendar className="h-8 w-8 text-primary" />,
      title: t('howItWorks.steps.schedule.title'),
      description: t('howItWorks.steps.schedule.description'),
      image: "/images/how-it-works/schedule.jpg",
      alt: "Schedule session",
      link: "/mentors",
      linkText: t('howItWorks.steps.schedule.linkText'),
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-primary" />,
      title: t('howItWorks.steps.connect.title'),
      description: t('howItWorks.steps.connect.description'),
      image: "/images/how-it-works/grow.jpg",
      alt: "Connect and grow",
      link: "/messages",
      linkText: t('howItWorks.steps.connect.linkText'),
    },
    {
      icon: <Award className="h-8 w-8 text-primary" />,
      title: t('howItWorks.steps.grow.title'),
      description: t('howItWorks.steps.grow.description'),
      image: "/images/how-it-works/grow-together.jpg",
      alt: "Achieve goals",
      link: "/dashboard",
      linkText: t('howItWorks.steps.grow.linkText'),
    },
  ]

  const mentorSteps = [
    {
      icon: <UserPlus className="h-8 w-8 text-primary" />,
      title: t('howItWorks.mentorSteps.register.title'),
      description: t('howItWorks.mentorSteps.register.description'),
      image: "/images/how-it-works/register-mentor.jpg",
      alt: "Register as mentor",
      link: "/signup",
      linkText: t('howItWorks.mentorSteps.register.linkText'),
    },
    {
      icon: <Lightbulb className="h-8 w-8 text-primary" />,
      title: t('howItWorks.mentorSteps.verify.title'),
      description: t('howItWorks.mentorSteps.verify.description'),
      image: "/images/how-it-works/verify.jpg",
      alt: "Get verified",
      link: "/profile",
      linkText: t('howItWorks.mentorSteps.verify.linkText'),
    },
    {
      icon: <Calendar className="h-8 w-8 text-primary" />,
      title: t('howItWorks.mentorSteps.availability.title'),
      description: t('howItWorks.mentorSteps.availability.description'),
      image: "/images/how-it-works/availability.jpg",
      alt: "Set availability",
      link: "/mentorship",
      linkText: t('howItWorks.mentorSteps.availability.linkText'),
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: t('howItWorks.mentorSteps.mentor.title'),
      description: t('howItWorks.mentorSteps.mentor.description'),
      image: "/images/how-it-works/conduct.jpg",
      alt: "Conduct sessions",
      link: "/dashboard",
      linkText: t('howItWorks.mentorSteps.mentor.linkText'),
    },
  ]

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          {t('howItWorks.hero.title')}
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          {t('howItWorks.hero.description')}
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/signup" passHref>
            <Button size="lg">
              {t('howItWorks.hero.getStarted')} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/mentors" passHref>
            <Button size="lg" variant="outline">
              {t('howItWorks.hero.findMentors')}
            </Button>
          </Link>
        </div>
      </section>

      <Separator className="my-16" />

      {/* How it Works for Mentees */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          {t('howItWorks.menteeSection.title')}
        </h2>
        <div className="space-y-16">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-8 items-center ${
                index % 2 === 1 ? "lg:grid-flow-col-dense" : ""
              }`}
            >
              <div className={`${index % 2 === 1 ? "lg:col-start-2" : ""}`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-primary/10 p-3 rounded-full">{step.icon}</div>
                  <h3 className="text-2xl font-bold">{step.title}</h3>
                </div>
                <p className="text-muted-foreground mb-6">{step.description}</p>
                <Link href={step.link} passHref>
                  <Button variant="outline">
                    {step.linkText} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className={`relative h-64 w-full md:h-80 rounded-lg overflow-hidden shadow-lg ${
                index % 2 === 1 ? "lg:col-start-1 lg:row-start-1" : ""
              }`}>
                <Image
                  src={step.image || "/placeholder.svg"}
                  alt={step.alt}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-lg"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <Separator className="my-16" />

      {/* How it Works for Mentors */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          {t('howItWorks.mentorSection.title')}
        </h2>
        <div className="space-y-16">
          {mentorSteps.map((step, index) => (
            <div
              key={index}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-8 items-center ${
                index % 2 === 1 ? "lg:grid-flow-col-dense" : ""
              }`}
            >
              <div className={`${index % 2 === 1 ? "lg:col-start-2" : ""}`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-primary/10 p-3 rounded-full">{step.icon}</div>
                  <h3 className="text-2xl font-bold">{step.title}</h3>
                </div>
                <p className="text-muted-foreground mb-6">{step.description}</p>
                <Link href={step.link} passHref>
                  <Button variant="outline">
                    {step.linkText} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className={`relative h-64 w-full md:h-80 rounded-lg overflow-hidden shadow-lg ${
                index % 2 === 1 ? "lg:col-start-1 lg:row-start-1" : ""
              }`}>
                <Image
                  src={step.image || "/placeholder.svg"}
                  alt={step.alt}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-lg"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <Separator className="my-16" />

      {/* Call to Action */}
      <section className="text-center mt-16">
        <h2 className="text-3xl font-bold mb-4">
          {t('howItWorks.cta.title')}
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          {t('howItWorks.cta.description')}
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/signup" passHref>
            <Button size="lg">
              {t('howItWorks.cta.joinNow')} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/about" passHref>
            <Button size="lg" variant="outline">
              {t('howItWorks.cta.learnMore')}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
