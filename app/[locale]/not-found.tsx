"use client"

import { Link, useRouter } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { Home, Compass, ArrowLeft, Sparkles, Users } from "lucide-react"
import { useTranslations } from "next-intl"

/**
 * 404 Not Found component for localized routes.
 * Follows Menvo's design system tokens, responsive layout,
 * and UX "Don't Make Me Think" recovery principles.
 */
export default function NotFound() {
  const t = useTranslations("common")
  const router = useRouter()

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push("/")
    }
  }

  return (
    <main
      id="main-content"
      className="relative min-h-[calc(100vh-14rem)] flex items-center justify-center px-4 py-16 overflow-hidden"
    >
      {/* Subtle decorative background ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-teal-400/10 via-primary/10 to-cyan-400/10 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-xl w-full mx-auto text-center space-y-8">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
          <Compass className="w-3.5 h-3.5 animate-spin-slow" />
          <span>Erro 404</span>
        </div>

        {/* Big 404 Display */}
        <div className="relative select-none">
          <span className="text-8xl sm:text-9xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-500 via-primary to-cyan-500 dark:from-teal-400 dark:via-primary dark:to-cyan-400">
            404
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            {t("notFound.title")}
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto leading-relaxed">
            {t("notFound.description")}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto gap-2 rounded-xl shadow-md shadow-primary/20 font-medium"
          >
            <Link href="/" id="not-found-home-btn">
              <Home className="w-4 h-4" />
              {t("notFound.backToHome")}
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto gap-2 rounded-xl border-primary/20 hover:border-primary/40 hover:bg-primary/5 font-medium"
          >
            <Link href="/mentors" id="not-found-mentors-btn">
              <Compass className="w-4 h-4" />
              {t("findMentors")}
            </Link>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={handleGoBack}
            className="w-full sm:w-auto gap-2 rounded-xl text-muted-foreground hover:text-foreground"
            id="not-found-back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("notFound.goBack")}
          </Button>
        </div>

        {/* Discovery Links Card */}
        <div className="pt-6 border-t border-border/50">
          <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-4">
            Ou explore outros caminhos
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <Link
              href="/quiz"
              className="group p-4 rounded-xl border border-border/60 hover:border-primary/40 bg-card hover:bg-accent/40 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    Match com IA
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Encontre o mentor ideal para o seu momento
                  </div>
                </div>
              </div>
            </Link>

            <Link
              href="/community"
              className="group p-4 rounded-xl border border-border/60 hover:border-primary/40 bg-card hover:bg-accent/40 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    Comunidade
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Conecte-se com outros profissionais
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
