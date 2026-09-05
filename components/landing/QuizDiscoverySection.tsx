"use client"

import Link from "next/link"
import { Sparkles, ArrowRight, BrainCircuit, CheckCircle2, Compass } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "next-intl"

/**
 * High-converting public Landing Page section to drive unauthenticated
 * or prospective mentees to take the AI Career Quiz.
 */
export function QuizDiscoverySection() {
  const t = useTranslations("home.quiz")

  return (
    <section className="w-full py-16 md:py-24 bg-gradient-to-b from-background via-primary/[0.03] to-background relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="container max-w-7xl px-4 md:px-6">
        <div className="rounded-3xl border border-primary/20 bg-card/80 backdrop-blur-md p-8 md:p-14 shadow-xl relative overflow-hidden">
          {/* Subtle accent ribbon */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-primary/20 via-purple-500/10 to-transparent rounded-bl-full pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Copy & Value Proposition */}
            <div className="lg:col-span-7 space-y-6">
              <Badge variant="secondary" className="px-3.5 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary border-primary/20 flex items-center gap-1.5 w-fit">
                <BrainCircuit className="w-3.5 h-3.5" />
                {t("badge")}
              </Badge>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-[1.15]">
                {t("title")}
              </h2>

              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xl">
                {t("subtitle")}
              </p>

              {/* Feature Checklist */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-foreground/90">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <span>{t("feature1")}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-foreground/90">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <span>{t("feature2")}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-foreground/90">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <span>{t("feature3")}</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
                <Button
                  size="lg"
                  asChild
                  className="rounded-full h-12 px-8 font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all text-base"
                >
                  <Link href="/quiz">
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t("ctaButton")}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>

                <Button
                  size="lg"
                  variant="ghost"
                  asChild
                  className="rounded-full h-12 px-6 text-muted-foreground hover:text-foreground font-medium"
                >
                  <Link href="/mentors">
                    <Compass className="w-4 h-4 mr-2" />
                    {t("exploreLink")}
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Column: Visual Card Preview */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-br from-primary/15 via-purple-500/10 to-blue-500/15 p-6 border border-border shadow-inner space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Preview</span>
                  <Badge className="bg-primary/20 text-primary border-none text-[10px] font-bold">2 MIN</Badge>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-3/4 bg-primary/20 rounded-full animate-pulse" />
                  <div className="h-3 w-1/2 bg-muted rounded-full" />
                </div>
                <div className="p-3.5 rounded-xl bg-background/80 border border-border/60 space-y-2">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Match Inteligente
                  </p>
                  <p className="text-xs text-muted-foreground leading-snug">
                    Análise em tempo real de momento de carreira e objetivos para sugerir os melhores mentores.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
