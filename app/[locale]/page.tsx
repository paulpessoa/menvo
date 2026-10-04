import { Link } from "@/i18n/routing"

import { Button } from "@/components/ui/button"

import { Badge } from "@/components/ui/badge"
import { Calendar, MessageSquare, Search } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { preload } from "react-dom"

import { MentorCard } from "@/components/mentors/MentorCard"
import { DeferredHeroActions } from "@/components/home/DeferredHeroActions"
import { getFeaturedMentors } from "@/lib/services/mentors/home-highlights"

const HERO_POSTER = "/images/ai-demo-poster.webp"

export default async function Home() {
  const t = await getTranslations("home")
  // A capa do vídeo é o maior elemento visível (LCP): pedir cedo, com prioridade.
  preload(HERO_POSTER, { as: "image", fetchPriority: "high" })
  const featuredMentors = await getFeaturedMentors()

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 bg-gradient-to-b from-secondary/50 to-background overflow-hidden">
        <div className="container px-4 md:px-6 flex flex-col lg:flex-row items-center justify-between min-h-[50vh] gap-10">
          {/* Texto */}
          <div className="flex-1 flex flex-col justify-center items-center lg:items-start">
            <Badge variant="secondary" className="w-fit mb-4 px-3 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary border-none">
              {t("badge.freeMentorship")}
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 text-center lg:text-left leading-tight text-foreground">
              {t("hero.title")}
            </h1>
            <p className="max-w-[540px] text-muted-foreground text-base md:text-lg mb-8 text-center lg:text-left leading-relaxed">
              {t("hero.description")}
            </p>
            <DeferredHeroActions />
          </div>
          {/* Vídeo */}
          <div className="flex-1 flex justify-center items-center relative">
            <div className="absolute -inset-4 bg-primary/5 rounded-full blur-3xl" />
            <div className="relative h-[250px] w-[250px] md:h-[350px] md:w-[350px] lg:h-[450px] lg:w-[450px] flex items-center shadow-xl rounded-3xl overflow-hidden ring-4 ring-white bg-muted/20">
              <video
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                poster={HERO_POSTER}
                className="object-cover w-full h-full"
                aria-label="Demonstração da plataforma Menvo"
              >
                <source src="/ai-demo-mentorship.webm" type="video/webm" />
                <source src="/ai-demo-mentorhip.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </section>


      {/* How It Works Section */}
      <section className="w-full py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="space-y-3">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
                {t("howItWorks.title")}
              </h2>
              <p className="max-w-[700px] text-muted-foreground text-base md:text-lg mx-auto">
                {t("howItWorks.description")}
              </p>
            </div>
          </div>
          <div className="mx-auto grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-12">
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
            <Button asChild>
              <Link href="/how-it-works">
                {t("howItWorks.learnMore")}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Mentors Section */}
      {featuredMentors.length > 0 && (
        <section className="w-full py-16 md:py-24 bg-muted/20">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-3 text-center mb-12">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
                {t("featuredMentors.title")}
              </h2>
              <p className="max-w-[700px] text-muted-foreground text-base md:text-lg mx-auto">
                {t("featuredMentors.description")}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredMentors.map((mentor) => (
                <MentorCard key={mentor.id ?? mentor.slug} mentor={mentor} />
              ))}
            </div>
            <div className="flex justify-center mt-12">
              <Button variant="outline" asChild>
                <Link href="/mentors">{t("featuredMentors.viewAll")}</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
