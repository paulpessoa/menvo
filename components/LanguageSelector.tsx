"use client"

import * as React from "react"
import { Globe, Check } from "lucide-react"
import { usePathname, useRouter } from "@/i18n/routing"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useLocale, useTranslations } from "next-intl"

export function LanguageSelector() {
  const locale = useLocale()
  const t = useTranslations("common")
  const pathname = usePathname()
  const router = useRouter()

  const languages = [
    { code: "pt-BR", label: t("portuguese") },
    { code: "en", label: t("english") },
    { code: "es", label: t("spanish") },
    { code: "da", label: t("danish") },
    { code: "fr", label: t("french") },
    { code: "sv", label: t("swedish") },
  ]

  const handleLanguageChange = (newLocale: string) => {
    // next-intl handling: router.replace keeps the same path but changes the locale
    router.replace(pathname, { locale: newLocale as any })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <Globe className="h-4 w-4" />
          <span className="sr-only">{t("language")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="flex items-center justify-between gap-2"
          >
            {lang.label}
            {locale === lang.code && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
