import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { routing } from '@/i18n/routing'
import type { Database } from '@/lib/types/supabase'

const BASE_URL = 'https://www.menvo.com.br'

// Without this, Next.js prerenders sitemap.ts once at build time and serves
// that static file until the next deploy — a newly approved mentor (or one
// who edits their profile) wouldn't appear/update in the sitemap until
// someone redeploys. Regenerate at most hourly instead.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    '',
    '/about',
    '/mentors',
    '/community',
    '/how-it-works',
    '/faq',
    '/doar',
    '/contact',
    '/privacy',
    '/terms',
    '/cookies'
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

  // Individual mentor profiles are the highest-value, most unique content
  // this site has for search — each is keyword-rich and one-of-a-kind —
  // but they were entirely missing from the sitemap, so search engines had
  // no way to discover them short of crawling internal links.
  try {
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      const supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

    const { data: mentors } = await supabase
      .from('mentors_view')
      .select('slug, updated_at')
      .eq('is_public', true)
      .not('slug', 'is', null)

        for (const mentor of mentors ?? []) {
          if (!mentor.slug) continue

          routing.locales.forEach((locale) => {
            const isDefault = locale === routing.defaultLocale
            const path = isDefault
              ? `/mentors/${mentor.slug}`
              : `/${locale}/mentors/${mentor.slug}`

            sitemapEntries.push({
              url: `${BASE_URL}${path}`,
              lastModified: mentor.updated_at ? new Date(mentor.updated_at) : new Date(),
              changeFrequency: 'weekly',
              priority: 0.8
            })
          })
        }
      }
  } catch (error) {
    // A sitemap that omits mentor profiles is still far better than a
    // sitemap.xml that 500s and takes down search indexing entirely.
    console.error('[sitemap] Failed to load mentor profiles:', error)
  }

  return sitemapEntries
}
