"use client"
import { Cookie, Globe, User, Settings, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "react-i18next"
import Link from "next/link"

export default function CookiesPage() {
  const { t } = useTranslation()
  return (
    <div className="container max-w-3xl py-10 md:py-16">
      <div className="flex flex-col items-center text-center mb-8">
        <Badge variant="outline" className="mb-2">
          <Cookie className="inline-block mr-2 h-4 w-4" />
          {t("cookies.badge")}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl mb-2">
          {t("cookies.title")}
        </h1>
        <p className="text-muted-foreground max-w-xl">
          {t("cookies.intro")}
        </p>
      </div>
      <div className="space-y-8 text-left">
        <section>
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-2"><Shield className="h-5 w-5" /> {t("cookies.essential.title")}</h2>
          <p>{t("cookies.essential.text")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-2"><User className="h-5 w-5" /> {t("cookies.social.title")}</h2>
          <p>{t("cookies.social.text")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-2"><Settings className="h-5 w-5" /> {t("cookies.preferences.title")}</h2>
          <p>{t("cookies.preferences.text")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-2"><Globe className="h-5 w-5" /> {t("cookies.analytics.title")}</h2>
          <p>{t("cookies.analytics.text")}</p>
        </section>
      </div>
      <div className="mt-10 flex flex-wrap gap-4 justify-center text-sm">
        <Link href="/privacy" className="underline text-muted-foreground hover:text-foreground">{t("cookies.links.privacy")}</Link>
        <Link href="/terms" className="underline text-muted-foreground hover:text-foreground">{t("cookies.links.terms")}</Link>
      </div>
    </div>
  )
} 