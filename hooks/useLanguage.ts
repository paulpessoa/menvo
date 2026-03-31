import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';

export const useLanguage = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const changeLanguage = (newLocale: string) => {
    // next-intl handled routing will preserve the pathname but change the locale
    router.replace(pathname, { locale: newLocale });
  };

  return {
    currentLanguage: locale,
    changeLanguage,
  };
};
