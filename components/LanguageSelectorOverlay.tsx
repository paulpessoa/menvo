"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/hooks/useLanguage"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { Globe, CheckCircle2 } from "lucide-react"
import { useTranslations } from "next-intl"

const languages = [
  { code: "pt-BR", name: "Português", flag: "🇧🇷" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" }
  // { code: "fr", name: "Français", flag: "🇫🇷" },
  // { code: "da", name: "Dansk", flag: "🇩🇰" },
  // { code: "sv", name: "Svenska", flag: "🇸🇪" },
]

export function LanguageSelectorOverlay() {
  const [isVisible, setIsVisible] = useState(false)
  const [step, setStep] = useState<"select" | "feedback">("select")
  const [selectedLocale, setSelectedLocale] = useState<string | null>(null)
  const { currentLanguage, changeLanguage } = useLanguage()
  const t = useTranslations("common.languageSelector")
  const commonT = useTranslations("common")

  useEffect(() => {
    // Verifica se já houve uma seleção prévia nesta máquina
    const hasSelected = localStorage.getItem("language-selected")
    if (!hasSelected) {
      setIsVisible(true)
    }
  }, [])

  const handleSelect = (code: string) => {
    setSelectedLocale(code)
    setStep("feedback")
  }

  const handleFinish = () => {
    if (selectedLocale) {
      changeLanguage(selectedLocale)
      localStorage.setItem("language-selected", "true")
      setIsVisible(false)
    }
  }

  const handleBack = () => {
    setStep("select")
    setSelectedLocale(null)
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4 text-foreground animate-in fade-in duration-500">
      {step === "select" ? (
        <div className="w-full max-w-2xl animate-in zoom-in-95 duration-300">
          <Card className="border-2 border-primary shadow-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl md:text-3xl">
                {t("title")}
              </CardTitle>
              <CardDescription className="text-lg">
                {t("description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {languages.map((lang) => (
                  <Button
                    key={lang.code}
                    variant="outline"
                    size="lg"
                    className="h-16 text-lg justify-start gap-4 hover:border-primary hover:bg-primary/5 transition-all"
                    onClick={() => handleSelect(lang.code)}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    {lang.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="w-full max-w-md text-center animate-in slide-in-from-bottom-4 duration-300">
          <Card className="border-2 border-green-500 shadow-2xl">
            <CardContent className="pt-8 pb-8">
              <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{t("successTitle")}</h3>
              <p className="text-muted-foreground mb-8">
                {t("successDescription")}
              </p>
              <div className="flex flex-col gap-3">
                <Button onClick={handleFinish} size="lg" className="w-full">
                  {t("button")}
                </Button>
                <Button
                  onClick={handleBack}
                  variant="ghost"
                  size="sm"
                  className="w-full"
                >
                  {commonT("back")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
