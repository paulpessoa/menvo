"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"

export function useLanguage() {
  const { i18n } = useTranslation()
  const [currentLanguage, setCurrentLanguage] = useState("pt-BR")

  useEffect(() => {
    setCurrentLanguage(i18n.language || "pt-BR")
  }, [i18n.language])

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language)
    setCurrentLanguage(language)
  }

  return {
    currentLanguage,
    changeLanguage,
  }
}
