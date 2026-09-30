"use client"

import { useEffect, useState } from "react"
import { useRouter } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock, ShieldCheck, CheckCircle2, Loader2 } from "lucide-react"
import { quizService } from "@/lib/services/quiz/quiz.service"

interface SaveAnalysisBannerProps {
  quizId: string
  /** The `k` token from the results e-mail link (`?k=...`). */
  token: string
}

type LinkStatus = "checking" | "claimable" | "exists" | "invalid" | "created"

/**
 * "Save this analysis to your account": shown only when the visitor arrived
 * with the signed `?k=` token from the results e-mail. Lets an anonymous
 * quiz-taker create a confirmed account (password only, no second
 * confirmation e-mail - see app/api/quiz/[id]/account/route.ts) or, if one
 * already exists for that e-mail, points them to log in.
 */
export function SaveAnalysisBanner({ quizId, token }: SaveAnalysisBannerProps) {
  const t = useTranslations("quiz")
  const router = useRouter()
  const [status, setStatus] = useState<LinkStatus>("checking")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    quizService.checkAccountLinkStatus(quizId, token).then((result) => {
      if (cancelled) return
      if (!result) {
        setStatus("invalid")
        return
      }
      setEmail(result.email)
      setStatus(result.status)
    })
    return () => {
      cancelled = true
    }
  }, [quizId, token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await quizService.createAccountFromResults(quizId, token, password)
      setStatus("created")
    } catch (err: any) {
      if (err?.status === "exists") {
        setStatus("exists")
      } else {
        setError(err?.message || t("quiz_results.save_analysis_error"))
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Back to this analysis after signing in, with the e-mail already filled.
  const goToLogin = () =>
    router.push({
      pathname: "/login",
      query: { email, next: `/quiz/results/${quizId}` }
    })

  if (status === "checking" || status === "invalid") return null

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2 shrink-0">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-3">
            {status === "created" ? (
              <>
                <h3 className="font-semibold text-foreground">
                  {t("quiz_results.save_analysis_success")}
                </h3>
                <Button onClick={goToLogin} className="rounded-xl">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {t("quiz_results.save_analysis_go_to_login")}
                </Button>
              </>
            ) : status === "exists" ? (
              <>
                <h3 className="font-semibold text-foreground">
                  {t("quiz_results.save_analysis_account_exists_title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("quiz_results.save_analysis_account_exists_description")}
                </p>
                <Button onClick={goToLogin} variant="outline" className="rounded-xl">
                  {t("quiz_results.save_analysis_account_exists_button")}
                </Button>
              </>
            ) : (
              <>
                <h3 className="font-semibold text-foreground">
                  {t("quiz_results.save_analysis_banner_title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("quiz_results.save_analysis_banner_description")}
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 pt-1">
                  <div className="relative flex-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      minLength={6}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("quiz_results.save_analysis_password_placeholder")}
                      className="pl-9"
                    />
                  </div>
                  <Button type="submit" disabled={submitting} className="rounded-xl whitespace-nowrap">
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t("quiz_results.save_analysis_button")
                    )}
                  </Button>
                </form>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
