"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock, ShieldCheck, CheckCircle2, Loader2 } from "lucide-react"
import { isExistingAccount, useAccountLink, useCreateQuizAccount } from "@/hooks/quiz/useAccountLink"

interface SaveAnalysisBannerProps {
  quizId: string
  /** The `k` token from the results e-mail link (`?k=...`). */
  token: string
}

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
  const link = useAccountLink(quizId, token)
  const createAccount = useCreateQuizAccount(quizId, token)
  const [password, setPassword] = useState("")

  // Invalid or expired link, still checking, or the check failed: show nothing.
  if (!link.data) return null

  const { email, status } = link.data
  const created = createAccount.isSuccess
  const exists = status === "exists" || isExistingAccount(createAccount.error)
  const error =
    createAccount.isError && !isExistingAccount(createAccount.error)
      ? createAccount.error.message || t("quiz_results.save_analysis_error")
      : null

  // Back to this analysis after signing in, with the e-mail already filled.
  const goToLogin = () =>
    router.push({
      pathname: "/login",
      query: { email, next: `/quiz/results/${quizId}` },
    })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createAccount.mutate(password)
  }

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-full bg-primary/10 p-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-3">
            {created ? (
              <>
                <h3 className="font-semibold text-foreground">{t("quiz_results.save_analysis_success")}</h3>
                <Button onClick={goToLogin} className="rounded-xl">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {t("quiz_results.save_analysis_go_to_login")}
                </Button>
              </>
            ) : exists ? (
              <>
                <h3 className="font-semibold text-foreground">{t("quiz_results.save_analysis_account_exists_title")}</h3>
                <p className="text-sm text-muted-foreground">{t("quiz_results.save_analysis_account_exists_description")}</p>
                <Button onClick={goToLogin} variant="outline" className="rounded-xl">
                  {t("quiz_results.save_analysis_account_exists_button")}
                </Button>
              </>
            ) : (
              <>
                <h3 className="font-semibold text-foreground">{t("quiz_results.save_analysis_banner_title")}</h3>
                <p className="text-sm text-muted-foreground">{t("quiz_results.save_analysis_banner_description")}</p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-2 pt-1 sm:flex-row">
                  <div className="relative flex-1">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                  <Button type="submit" disabled={createAccount.isPending} className="whitespace-nowrap rounded-xl">
                    {createAccount.isPending ? (
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
