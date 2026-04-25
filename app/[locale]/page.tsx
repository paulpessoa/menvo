"use client"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

import { Badge } from "@/components/ui/badge"
import { Calendar, MessageSquare, Search } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { TestimonialsCarousel } from "@/components/TestimonialsCarousel"

export default function Home() {
  const t = useTranslations("home")
  const tCommon = useTranslations("common")
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
      <section className="w-full py-16 md:py-32 bg-gradient-to-b from-secondary to-background overflow-hidden">
        <div className="container max-w-7xl px-4 md:px-6 flex flex-col lg:flex-row items-center justify-between min-h-[60vh] gap-12 lg:gap-20">
          {/* Texto */}
          <div className="flex-1 flex flex-col justify-center items-center lg:items-start max-w-2xl">
            <Badge variant="secondary" className="w-fit mb-6 px-4 py-1 text-sm font-medium rounded-full bg-primary/10 text-primary border-none">
              {t("badge.freeMentorship")}
            </Badge>
            <h1 className="text-5xl md:text-6xl xl:text-7xl font-extrabold tracking-tight mb-6 text-center lg:text-left leading-[1.1] text-gray-900">
              {t("hero.title")}
            </h1>
            <p className="max-w-[540px] text-muted-foreground text-lg md:text-xl mb-10 text-center lg:text-left leading-relaxed">
              {t("hero.description")}
            </p>
            <div className="flex flex-col gap-4 w-full max-w-sm mx-auto lg:flex-row lg:max-w-none lg:mx-0">
              <Button size="xl" asChild className="w-full lg:w-auto px-10 h-14 text-lg shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                <Link href="/mentors">{t("hero.findMentor")}</Link>
              </Button>
              <Button size="xl" variant="outline" asChild className="w-full lg:w-auto px-10 h-14 text-lg border-2 hover:bg-muted">
                <Link href="/signup">{t("hero.becomeMentor")}</Link>
              </Button>
            </div>
          </div>
          {/* Imagem */}
          <div className="flex-1 flex justify-center items-center relative">
            <div className="absolute -inset-4 bg-primary/5 rounded-full blur-3xl" />
            <div className="relative h-[280px] w-[280px] md:h-[400px] md:w-[400px] lg:h-[500px] lg:w-[500px] flex items-center shadow-2xl rounded-3xl overflow-hidden ring-8 ring-white">
              {images.map((src, index) => (
                <Image
                  key={index}
                  src={src}
                  width={600}
                  height={600}
                  alt={t("hero.title")}
                  className={`rounded-lg object-cover transition-opacity duration-1000 absolute top-0 left-0 w-full h-full ${
                    index === currentIndex ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-20 md:py-32">
        <div className="container max-w-7xl px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
            <div className="space-y-4">
              <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-gray-900">
                {t("howItWorks.title")}
              </h2>
              <p className="max-w-[700px] text-muted-foreground text-lg md:text-xl mx-auto">
                {t("howItWorks.description")}
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3 lg:gap-16">
            <div className="flex flex-col items-center space-y-4 text-center p-6 rounded-2xl hover:bg-muted/50 transition-colors">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 transform -rotate-3 hover:rotate-0 transition-transform">
                <Search className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold pt-2">
                {t("howItWorks.step1.title")}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t("howItWorks.step1.description")}
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center p-6 rounded-2xl hover:bg-muted/50 transition-colors">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 transform rotate-2 hover:rotate-0 transition-transform">
                <Calendar className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold pt-2">
                {t("howItWorks.step2.title")}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t("howItWorks.step2.description")}
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center p-6 rounded-2xl hover:bg-muted/50 transition-colors">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 transform -rotate-2 hover:rotate-0 transition-transform">
                <MessageSquare className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold pt-2">
                {t("howItWorks.step3.title")}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t("howItWorks.step3.description")}
              </p>
            </div>
          </div>
          <div className="flex justify-center mt-16">
            <Button size="lg" variant="outline" asChild className="rounded-full px-8">
              <Link href="/how-it-works">{t("howItWorks.learnMore")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="w-full py-20 md:py-32 bg-slate-50">
        <div className="container max-w-7xl px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
            <div className="space-y-4">
              <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-gray-900">
                {t("testimonials.title")}
              </h2>
              <p className="max-w-[800px] text-muted-foreground text-lg md:text-xl mx-auto">
                {t("testimonials.description")}
              </p>
            </div>
          </div>
          <TestimonialsCarousel />
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="container max-w-7xl px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center justify-center space-y-8 text-center">
            <div className="space-y-4">
              <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
                {t("cta.title")}
              </h2>
              <p className="max-w-[700px] md:text-2xl opacity-90 mx-auto leading-relaxed">
                {t("cta.description")}
              </p>
            </div>
            <div className="flex flex-col gap-4 min-[400px]:flex-row">
              <Button size="xl" variant="secondary" asChild className="px-12 h-16 text-xl shadow-2xl hover:scale-105 transition-transform">
                <Link href="/signup">{t("cta.signup")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
