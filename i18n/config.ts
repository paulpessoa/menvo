import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import en from './translations/en.json';
import ptBR from './translations/pt-BR.json';
import es from './translations/es.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      'pt-BR': { translation: ptBR },
      es: { translation: es },
    },
    lng: 'pt-BR', // default language
    fallbackLng: 'pt-BR',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
