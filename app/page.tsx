"use client"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Clock,
  Globe,
  Lightbulb,
  MessageSquare,
  Search,
  Users
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import { TestimonialsCarousel } from "@/components/TestimonialsCarousel"

export default function Home() {
  const { t } = useTranslation()
  const images = [
    "/images/e.jpg",
    "/images/d.jpg",
    "/images/c.jpg",
    "/images/b.jpg"
  ]
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [images.length])

  // MOCK de mentores em destaque
  const featuredMentorsMock = [
    {
      id: 1,
      name: "Sarah Johnson",
      field: "Engenharia de Software",
      tags: ["Carreira", "Tecnologia", "Liderança"],
      bio: "Mais de 10 anos de experiência ajudando novos programadores a navegar na indústria de tecnologia.",
      languages: "Inglês, Espanhol",
      imageUrl: "/images/mockMentors/9963087.jpg"
    },
    {
      id: 2,
      name: "Carlos Silva",
      field: "Gestão de Projetos",
      tags: ["Gestão", "Agile", "Carreira"],
      bio: "Especialista em gestão de projetos e mentor de equipes ágeis, apaixonado por ajudar profissionais a crescerem.",
      languages: "Português, Inglês",
      imageUrl: "/images/mockMentors/10879746.jpg"
    },
    {
      id: 3,
      name: "Maria López",
      field: "Data Science",
      tags: ["Dados", "Python", "Academia"],
      bio: "Cientista de dados e professora universitária, dedicada a orientar novos talentos na área de dados.",
      languages: "Espanhol, Inglês",
      imageUrl: "/images/mockMentors/8681238.jpg"
    }
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-20 bg-gradient-to-b from-secondary to-background">
        <div className="container max-w-7xl px-4 md:px-6 flex flex-col lg:flex-row items-center justify-center min-h-[60vh] gap-12">
          {/* Texto */}
          <div className="flex-1 flex flex-col justify-center items-center lg:items-start max-w-xl">
            <Badge variant="outline" className="w-fit mb-4">
              {t("home.badge.freeMentorship")}
            </Badge>
            <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold tracking-tighter mb-4 text-center lg:text-left leading-tight">
              {t("home.hero.title")}
            </h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl mb-6 text-center lg:text-left">
              {t("home.hero.description")}
            </p>
            <div className="flex flex-col gap-2 w-full max-w-xs mx-auto lg:flex-row lg:max-w-none lg:mx-0">
              <Button size="lg" asChild className="w-full">
                <Link href="/mentors">{t("home.hero.findMentor")}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full">
                <Link href="/signup">{t("home.hero.becomeMentor")}</Link>
              </Button>
            </div>
          </div>
          {/* Imagem */}
          <div className="flex-1 flex justify-center items-center">
            <div className="relative h-[220px] w-[220px] md:h-[350px] md:w-[350px] lg:h-[450px] lg:w-[450px] xl:h-[550px] xl:w-[550px] flex items-center">
              {images.map((src, index) => (
                <Image
                  key={index}
                  src={src}
                  width={550}
                  height={550}
                  alt={t("home.hero.title")}
                  className={`rounded-lg object-cover transition-opacity duration-1000 absolute top-0 left-0 w-full h-full ${index === currentIndex ? "opacity-100" : "opacity-0"
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container max-w-7xl px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                {t("home.howItWorks.title")}
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl">
                {t("home.howItWorks.description")}
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 lg:gap-12 pt-8 md:pt-12">
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">
                {t("home.howItWorks.step1.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("home.howItWorks.step1.description")}
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Calendar className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">
                {t("home.howItWorks.step2.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("home.howItWorks.step2.description")}
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">
                {t("home.howItWorks.step3.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("home.howItWorks.step3.description")}
              </p>
            </div>
          </div>
          <div className="flex justify-center mt-8">
            <Button asChild>
              <Link href="/how-it-works">{t("home.howItWorks.learnMore")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Mentors Section */}
      {/* <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
          <div className="container max-w-7xl px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">{t("home.featuredMentors.title")}</h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl">
                  {t("home.featuredMentors.description")}
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 pt-8 md:pt-12">
              {featuredMentorsMock.map((mentor) => (
                <Card key={mentor.id} className="overflow-hidden">
                  <CardHeader className="p-0">
                    <div className="relative h-48 w-full">
                      <Image
                        src={mentor.imageUrl}
                        alt={mentor.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <CardTitle className="text-xl">{mentor.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                      <Lightbulb className="h-4 w-4" />
                      <span className="text-sm">{mentor.field}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {mentor.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                    <CardDescription className="mt-4">{mentor.bio}</CardDescription>
                  </CardContent>
                  <CardFooter className="border-t p-6 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <span>{mentor.languages}</span>
                    </div>
                    <Button size="sm" asChild>
                      <Link href={`/mentors/${mentor.id}`}>{t("home.mentor.viewProfile")}</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            <div className="flex justify-center mt-8">
              <Button asChild>
                <Link href="/mentors">{t("home.featuredMentors.viewAll")}</Link>
              </Button>
            </div>
          </div>
        </section> */}

      {/* Upcoming Events Section */}
      {/* <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container max-w-7xl px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">{t("home.events.title")}</h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl">
                  {t("home.events.description")}
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 pt-8 md:pt-12">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle>{t("home.events.card.title")}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">{t("home.events.card.date")}</span>
                      <Clock className="h-4 w-4 ml-2" />
                      <span className="text-sm">{t("home.events.card.time")}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      {t("home.events.card.description")}
                    </CardDescription>
                    <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{t("home.events.card.attendees", { count: 120 })}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-6">
                    <Badge>{t("home.event.type")}</Badge>
                    <Button size="sm">{t("home.events.card.register")}</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            <div className="flex justify-center mt-8">
              <Button asChild variant="outline">
                <Link href="/events">{t("home.events.viewAll")}</Link>
              </Button>
            </div>
          </div>
        </section> */}

      {/* Testimonials Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary/30">
        <div className="container max-w-7xl px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                {t("home.testimonials.title")}
              </h2>
              <p className="max-w-[800px] text-muted-foreground md:text-xl">
                {t("home.testimonials.description")}
              </p>
            </div>
          </div>
          <TestimonialsCarousel />
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-primary-600 text-primary-foreground">
        <div className="container max-w-7xl px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                {t("home.cta.title")}
              </h2>
              <p className="max-w-[700px] md:text-xl">
                {t("home.cta.description")}
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/signup">{t("home.cta.signup")}</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent"
                asChild
              >
                <Link href="/how-it-works">{t("home.cta.learnMore")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
