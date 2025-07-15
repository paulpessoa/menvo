import i18n from "i18next"
import { initReactI18next } from "react-i18next"

// Importar traduções
import enTranslations from "./translations/en.json"
import ptBRTranslations from "./translations/pt-BR.json"
import esTranslations from "./translations/es.json"

const resources = {
  en: {
    translation: enTranslations,
  },
  "pt-BR": {
    translation: ptBRTranslations,
  },
  es: {
    translation: esTranslations,
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: "pt-BR",
  fallbackLng: "pt-BR",
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
