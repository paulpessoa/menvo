import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/routing"
import { BrainCircuit, CheckCircle2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

/**
 * High-converting public Landing Page section to drive unauthenticated
 * or prospective mentees to take the AI Career Quiz.
 */
export async function QuizDiscoverySection() {
  const t = await getTranslations("home.quiz")

  return (
    <section className="w-full py-12 md:py-16 bg-background relative overflow-hidden">
      <div className="container max-w-3xl px-4 md:px-6">
        <div className="rounded-2xl border border-primary/10 bg-primary/[0.02] p-6 md:p-10 flex flex-col items-center text-center">

          <Badge variant="secondary" className="mb-4 px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary border-primary/20 flex items-center gap-1.5 w-fit">
            <BrainCircuit className="w-3.5 h-3.5" />
            {t("badge")}
          </Badge>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-tight mb-3">
            {t("title")}
          </h2>

          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-xl mb-6">
            {t("subtitle")}
          </p>

          <Button
            asChild
            className="rounded-xl font-bold px-6 shadow-sm hover:scale-105 transition-transform"
          >
            <Link href="/quiz">
              {t("ctaButton")}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
