"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { MenvoDots } from "@/components/ui/menvo-loader"

/**
 * Waiting screen while the AI analysis runs (it takes ~10s or more). Rotates
 * the message so a long wait still looks alive.
 */
export function ResultLoading() {
  const t = useTranslations("quiz")
  const texts = [
    t("quiz_results.processing_analysis"),
    "Lendo suas respostas...",
    "Buscando padrões de desenvolvimento...",
    "Analisando seu momento de carreira...",
    "Procurando os mentores ideais...",
    "Preparando seus próximos passos...",
  ]
  const [textIndex, setTextIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTextIndex((prev) => (prev + 1) % texts.length), 3000)
    return () => clearInterval(interval)
  }, [texts.length])

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-gradient-to-b from-accent/60 to-background px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <MenvoDots />
        <div className="flex h-16 flex-col justify-center">
          <p key={textIndex} className="animate-in fade-in zoom-in text-xl font-semibold text-primary duration-500">
            {texts[textIndex]}
          </p>
        </div>
      </div>
    </div>
  )
}
