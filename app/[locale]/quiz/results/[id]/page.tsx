"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useToast } from "@/hooks/use-toast"
import { useQuizResult } from "@/hooks/quiz/useQuizResult"
import { useMentorSlugs } from "@/hooks/quiz/useMentorSlugs"
import { ShareDiagnosticModal } from "@/components/diagnostic/ShareDiagnosticModal"
import { SaveAnalysisBanner } from "@/components/quiz/SaveAnalysisBanner"
import { ResultLoading } from "@/components/quiz/results/ResultLoading"
import { RetakeNotice } from "@/components/quiz/results/RetakeNotice"
import { ResultHeader } from "@/components/quiz/results/ResultHeader"
import { SuggestedMentors } from "@/components/quiz/results/SuggestedMentors"
import { PRINT_STYLES } from "@/components/quiz/results/ResultSection"
import {
  ActionPlan,
  DevelopmentAreas,
  FinalMessage,
  PotentialMentorCta,
  PracticalAdvice,
  ResultFooter,
} from "@/components/quiz/results/ResultSections"

/**
 * /quiz/results/[id] - the shareable result of a quiz. Public by design: the
 * link goes to LinkedIn/WhatsApp, so the page only ever holds the analysis.
 * Data and polling live in `useQuizResult`; this page only composes.
 */
export default function QuizResultsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const t = useTranslations("quiz")
  const id = typeof params.id === "string" ? params.id : undefined

  // Captured once on mount: the results e-mail link carries this so the
  // "save to account" banner can create an account for that address.
  const [accountToken] = useState(() => searchParams.get("k"))
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  const { data: result, isError } = useQuizResult(id)
  const analysis = result?.processed_at ? result.ai_analysis : null
  const isOwner = result?.is_owner === true

  const slugs = useMentorSlugs(
    (analysis?.mentores_sugeridos ?? []).map((m) => m.mentor_nome?.trim()).filter((n): n is string => Boolean(n))
  )

  // The token proves e-mail receipt, not "safe to share": drop it from the
  // address bar so it never ends up in a WhatsApp/LinkedIn share link.
  useEffect(() => {
    if (accountToken) {
      const url = new URL(window.location.href)
      url.searchParams.delete("k")
      window.history.replaceState(null, "", url.pathname + url.search)
    }
  }, [accountToken])

  // A result that never arrives (not found, server error, ~4 min timeout) or
  // arrives unreadable: say so once, and keep the waiting screen.
  const unreadable = Boolean(result?.processed_at) && !result?.ai_analysis
  useEffect(() => {
    if (isError || unreadable) {
      toast({
        title: t("quiz_results.error_loading_results_toast_title"),
        description: t("quiz_results.error_loading_results_toast_description"),
        variant: "destructive",
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isError, unreadable])

  if (!result || !analysis) return <ResultLoading />
  if (analysis.precisa_refazer) return <RetakeNotice analysis={analysis} />

  return (
    <div className="bg-gradient-to-b from-accent/70 via-background to-background print:bg-none">
      <style>{PRINT_STYLES}</style>

      <article id="quiz-result" className="mx-auto max-w-5xl px-4 pb-16 pt-10 md:pt-14">
        <ResultHeader analysis={analysis} />

        {accountToken && id && (
          <div className="mt-8 print:hidden">
            <SaveAnalysisBanner quizId={id} token={accountToken} />
          </div>
        )}

        <div className="mt-10 space-y-12">
          {analysis.proximos_passos?.length > 0 && <ActionPlan steps={analysis.proximos_passos} />}

          {analysis.mentores_sugeridos?.length > 0 && (
            <SuggestedMentors
              mentors={analysis.mentores_sugeridos}
              slugs={slugs}
              canShare={isOwner}
              onShare={() => setIsShareModalOpen(true)}
            />
          )}

          {analysis.conselhos_praticos?.length > 0 && <PracticalAdvice tips={analysis.conselhos_praticos} />}
          {analysis.areas_desenvolvimento?.length > 0 && <DevelopmentAreas areas={analysis.areas_desenvolvimento} />}
          {analysis.mensagem_final && <FinalMessage message={analysis.mensagem_final} />}
          {analysis.potencial_mentor && <PotentialMentorCta />}
        </div>

        <ResultFooter processedAt={result.processed_at} />
      </article>

      {isOwner && (
        <ShareDiagnosticModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          quizResponseId={result.id}
          suggestedMentors={analysis.mentores_sugeridos}
          mentorIdMap={slugs.idByName}
        />
      )}
    </div>
  )
}
