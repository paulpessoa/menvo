import { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'

const BASE_URL = 'https://www.menvo.com.br'

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/about',
    '/mentors',
    '/community',
    '/how-it-works',
    '/faq',
    '/doar',
    '/privacy',
    '/terms',
    '/login',
    '/signup'
  ]

  const sitemapEntries: MetadataRoute.Sitemap = []

  routes.forEach((route) => {
    routing.locales.forEach((locale) => {
      const isDefault = locale === routing.defaultLocale
      const path = isDefault ? route : `/${locale}${route}`
      
      // Remove trailing slash for root of default locale
      const fullPath = path === '' ? '' : path

      sitemapEntries.push({
        url: `${BASE_URL}${fullPath}`,
        lastModified: new Date(),
        changeFrequency: route === '' || route === '/mentors' ? 'daily' : 'weekly',
        priority: route === '' ? 1.0 : route === '/mentors' ? 0.9 : 0.7,
      })
    })
  })

  return sitemapEntries
}
