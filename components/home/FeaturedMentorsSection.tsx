import { Link } from "@/i18n/routing"
import { getTranslations } from "next-intl/server"

import { Button } from "@/components/ui/button"
import { MentorCard } from "@/components/mentors/MentorCard"
import { getFeaturedMentors } from "@/lib/services/mentors/home-highlights"

/**
 * Seção de mentores em destaque da home.
 *
 * É um Server Component assíncrono isolado de propósito: a home o envolve em
 * `<Suspense>`, então o hero é enviado sem esperar a consulta. Se a página
 * inteira aguardasse os dados, o `loading.tsx` (overlay em tela cheia) seria
 * pintado primeiro e o conteúdo chegaria depois, empurrando o rodapé e
 * gerando um CLS enorme.
 */
export async function FeaturedMentorsSection() {
  const [t, featuredMentors] = await Promise.all([
    getTranslations("home"),
    getFeaturedMentors(),
  ])

  if (featuredMentors.length === 0) return null

  return (
    <section className="w-full py-16 md:py-24 bg-muted/20">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-3 text-center mb-12">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            {t("featuredMentors.title")}
          </h2>
          <p className="max-w-[700px] text-muted-foreground text-base md:text-lg mx-auto">
            {t("featuredMentors.description")}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredMentors.map((mentor) => (
            <MentorCard key={mentor.id ?? mentor.slug} mentor={mentor} />
          ))}
        </div>
        <div className="flex justify-center mt-12">
          <Button variant="outline" asChild>
            <Link href="/mentors">{t("featuredMentors.viewAll")}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
