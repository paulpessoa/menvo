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
      <section className="w-full py-12 md:py-24 bg-gradient-to-b from-secondary/50 to-background overflow-hidden">
        <div className="container max-w-7xl px-4 md:px-6 flex flex-col lg:flex-row items-center justify-between min-h-[50vh] gap-10">
          {/* Texto */}
          <div className="flex-1 flex flex-col justify-center items-center lg:items-start max-w-2xl">
            <Badge variant="secondary" className="w-fit mb-4 px-3 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary border-none">
              {t("badge.freeMentorship")}
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 text-center lg:text-left leading-tight text-gray-900">
              {t("hero.title")}
            </h1>
            <p className="max-w-[540px] text-muted-foreground text-base md:text-lg mb-8 text-center lg:text-left leading-relaxed">
              {t("hero.description")}
            </p>
            <div className="flex flex-col gap-3 w-full max-w-sm mx-auto lg:flex-row lg:max-w-none lg:mx-0">
              <Button size="lg" asChild className="w-full lg:w-auto px-8 h-12 shadow-lg shadow-primary/10 hover:scale-105 transition-transform font-bold">
                <Link href="/mentors">{t("hero.findMentor")}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full lg:w-auto px-8 h-12 border-2 hover:bg-muted font-bold">
                <Link href="/signup">{t("hero.becomeMentor")}</Link>
              </Button>
            </div>
          </div>
          {/* Imagem */}
          <div className="flex-1 flex justify-center items-center relative">
            <div className="absolute -inset-4 bg-primary/5 rounded-full blur-3xl" />
            <div className="relative h-[250px] w-[250px] md:h-[350px] md:w-[350px] lg:h-[450px] lg:w-[450px] flex items-center shadow-xl rounded-3xl overflow-hidden ring-4 ring-white">
              {images.map((src, index) => (
                <Image
                  key={index}
                  src={src}
                  width={500}
                  height={500}
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
      <section className="w-full py-16 md:py-24">
        <div className="container max-w-7xl px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="space-y-3">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-gray-900">
                {t("howItWorks.title")}
              </h2>
              <p className="max-w-[700px] text-muted-foreground text-base md:text-lg mx-auto">
                {t("howItWorks.description")}
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 lg:gap-12">
            <div className="flex flex-col items-center space-y-3 text-center p-6 rounded-2xl hover:bg-muted/30 transition-colors">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/10">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold pt-1">
                {t("howItWorks.step1.title")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("howItWorks.step1.description")}
              </p>
            </div>
            <div className="flex flex-col items-center space-y-3 text-center p-6 rounded-2xl hover:bg-muted/30 transition-colors">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/10">
                <Calendar className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold pt-1">
                {t("howItWorks.step2.title")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("howItWorks.step2.description")}
              </p>
            </div>
            <div className="flex flex-col items-center space-y-3 text-center p-6 rounded-2xl hover:bg-muted/30 transition-colors">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/10">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold pt-1">
                {t("howItWorks.step3.title")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("howItWorks.step3.description")}
              </p>
            </div>
          </div>
          <div className="flex justify-center mt-12">
            <Button variant="outline" asChild className="rounded-full px-6">
              <Link href="/how-it-works">{t("howItWorks.learnMore")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="w-full py-16 md:py-24 bg-slate-50/50">
        <div className="container max-w-7xl px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="space-y-3">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-gray-900">
                {t("testimonials.title")}
              </h2>
              <p className="max-w-[800px] text-muted-foreground text-base md:text-lg mx-auto">
                {t("testimonials.description")}
              </p>
            </div>
          </div>
          <TestimonialsCarousel />
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-16 md:py-20 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="container max-w-7xl px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            <div className="space-y-3">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                {t("cta.title")}
              </h2>
              <p className="max-w-[600px] md:text-xl opacity-90 mx-auto leading-relaxed">
                {t("cta.description")}
              </p>
            </div>
            <div className="flex flex-col gap-4 min-[400px]:flex-row">
              <Button size="lg" variant="secondary" asChild className="px-10 h-14 text-lg shadow-xl hover:scale-105 transition-transform font-bold">
                <Link href="/signup">{t("cta.signup")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
