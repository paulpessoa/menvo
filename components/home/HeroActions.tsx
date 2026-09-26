"use client"

import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"
import { useAuth } from "@/lib/auth"

/** Botões do hero — o link de "Torne-se um Mentor" depende do login. */
export function HeroActions() {
  const t = useTranslations("home.hero")
  const { isAuthenticated } = useAuth()

  return (
    <div className="flex flex-col gap-3 w-full max-w-sm mx-auto lg:flex-row lg:max-w-none lg:mx-0">
      <Button size="lg" asChild className="w-full lg:w-auto">
        <Link href="/mentors">{t("findMentor")}</Link>
      </Button>
      <Button size="lg" variant="outline" asChild className="w-full lg:w-auto">
        <Link href={isAuthenticated ? "/profile?tab=mentorship" : "/how-it-works?tab=mentors"}>
          {t("becomeMentor")}
        </Link>
      </Button>
    </div>
  )
}
