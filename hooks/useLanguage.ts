import { useState, useEffect } from 'react';
import i18n from '../i18n/config';

export const useLanguage = () => {
  const [currentLanguage, setCurrentLanguage] = useState<string>(i18n.language);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setCurrentLanguage(lng);
    localStorage.setItem('language', lng); // <-- salva no localStorage garantindo que na próxima vez que o usuário acessar a aplicação,
  };                                      // ela já esteja no idioma que ele selecionou, sem precisar escolher novamente.

  useEffect(() => {
    const language = localStorage.getItem('language') || 'pt-BR';
    changeLanguage(language);
  }, []);

  return {
    currentLanguage,
    changeLanguage,
  };
};
