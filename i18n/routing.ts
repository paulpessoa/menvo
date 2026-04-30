import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['pt-BR', 'en', 'es'],

  // Used when no locale matches
  defaultLocale: 'pt-BR',
  
  // Don't show the locale prefix for the default locale
  localePrefix: 'as-needed'
});

// Lightweight wrappers around Next.js navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
