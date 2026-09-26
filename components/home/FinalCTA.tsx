"use client"

import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"
import { useAuth } from "@/lib/auth"

/** CTA final: convida a se cadastrar ou, se já logado, leva ao painel. */
export function FinalCTA() {
  const t = useTranslations("home.cta")
  const { isAuthenticated } = useAuth()

  return (
    <section className="w-full py-16 md:py-20 bg-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
      <div className="container  px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              {isAuthenticated ? t("titleAuthenticated") : t("title")}
            </h2>
            <p className="max-w-[600px] md:text-xl opacity-90 mx-auto leading-relaxed">
              {isAuthenticated ? t("descriptionAuthenticated") : t("description")}
            </p>
          </div>
          <div className="flex flex-col gap-4 min-[400px]:flex-row">
            <Button size="xl" variant="secondary" asChild>
              {isAuthenticated ? (
                <Link href="/dashboard">{t("dashboard")}</Link>
              ) : (
                <Link href="/signup">{t("signup")}</Link>
              )}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
