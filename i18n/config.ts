import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import qUS from './quiz/en-US.json';
import qBR from './quiz/pt-BR.json';
import qES from './quiz/es-ES.json';

import en from './translations/en.json';
import ptBR from './translations/pt-BR.json';
import es from './translations/es.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en,   quiz: qUS, },
      'pt-BR': { translation: ptBR, quiz: qBR, },
      es: { translation: es, quiz: qES, },
    },
    lng: 'pt-BR', // default language
    fallbackLng: 'pt-BR',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
