"use client"

import { useTranslations } from "next-intl"
import { AlertCircle, X } from "lucide-react"
import { useState, useEffect } from "react"

export function ConstructionWarning() {
  const t = useTranslations("common.constructionWarning")
  const [isVisible, setIsVisible] = useState(true)

  // Ocultar se o usuário já fechou nesta sessão
  useEffect(() => {
    const hidden = sessionStorage.getItem("hide-construction-warning")
    if (hidden) setIsVisible(false)
  }, [])

  const handleClose = () => {
    sessionStorage.setItem("hide-construction-warning", "true")
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 py-2 px-4">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-amber-800 text-sm md:text-base">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>
            <strong>{t("title")}:</strong> {t("description")}
          </p>
        </div>
        <button 
          onClick={handleClose}
          className="text-amber-600 hover:text-amber-900 transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}