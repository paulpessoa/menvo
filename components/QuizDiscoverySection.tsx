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
    <section className="w-full py-16 md:py-24 bg-gradient-to-b from-background via-primary/[0.03] to-background relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="container max-w-4xl px-4 md:px-6">
        <div className="rounded-3xl border border-primary/20 bg-card/80 backdrop-blur-md p-8 md:p-14 shadow-xl relative overflow-hidden flex flex-col items-center text-center">
          {/* Subtle accent ribbon */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-primary/20 via-purple-500/10 to-transparent rounded-bl-full pointer-events-none" />

          <Badge variant="secondary" className="mb-6 px-3.5 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary border-primary/20 flex items-center gap-1.5 w-fit">
            <BrainCircuit className="w-3.5 h-3.5" />
            {t("badge")}
          </Badge>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-[1.15] mb-5">
            {t("title")}
          </h2>

          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-2xl mb-8">
            {t("subtitle")}
          </p>

          <Button
            size="lg"
            asChild
            className="rounded-xl font-bold px-8 shadow-md hover:scale-105 transition-transform"
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
