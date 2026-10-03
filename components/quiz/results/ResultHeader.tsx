"use client"

import { useState } from "react"
import { Check, Link2, Linkedin, MessageCircle, Printer } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { QuizAnalysis } from "@/lib/domain/quiz/quiz.entity"

/** The shared URL never carries the `?k=` token (it proves e-mail receipt, not "safe to share"). */
const pageUrl = () => window.location.href.split("?")[0]

const shareButtonClass = "rounded-xl gap-2"

/** Headline, summary and the share/print actions of a quiz result. */
export function ResultHeader({ analysis }: { analysis: QuizAnalysis }) {
  const t = useTranslations("quiz")
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: pageUrl() })
    }
  }

  const handleShareWhatsApp = () => {
    const text = t("quiz_results.whatsapp_message", { url: pageUrl() })
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener")
  }

  // share-offsite renders the page's Open Graph preview (title + image).
  const handleShareLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl())}`,
      "_blank",
      "noopener"
    )
  }

  return (
    <header className="border-b pb-8">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">{t("quiz_results.eyebrow")}</p>
      <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl">
        {analysis.titulo_personalizado}
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{analysis.resumo_motivador}</p>

      <div className="mt-6 flex flex-wrap gap-2 print:hidden">
        <Button variant="outline" size="sm" className={shareButtonClass} onClick={handleCopyLink}>
          {copied ? <Check className="h-4 w-4 text-primary" /> : <Link2 className="h-4 w-4" />}
          {copied ? t("quiz_results.link_copied") : t("quiz_results.copy_link")}
        </Button>
        <Button variant="outline" size="sm" className={shareButtonClass} onClick={handleShareWhatsApp}>
          <MessageCircle className="h-4 w-4" />
          {t("quiz_results.whatsapp")}
        </Button>
        <Button variant="outline" size="sm" className={shareButtonClass} onClick={handleShareLinkedIn}>
          <Linkedin className="h-4 w-4" />
          {t("quiz_results.linkedin")}
        </Button>
        <Button variant="outline" size="sm" className={shareButtonClass} onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          {t("quiz_results.print")}
        </Button>
      </div>
    </header>
  )
}
