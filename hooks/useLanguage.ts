import { useState, useEffect } from 'react';
import i18n from '../i18n/config';

export const useLanguage = () => {
  const [currentLanguage, setCurrentLanguage] = useState<string>(i18n.language);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setCurrentLanguage(lng);
  };

  useEffect(() => {
    const language = localStorage.getItem('language') || 'pt-BR';
    changeLanguage(language);
  }, []);

  return {
    currentLanguage,
    changeLanguage,
  };
};
