"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, ScrollText } from "lucide-react"
import { Link, usePathname } from "@/i18n/routing"
import { useAuth } from "@/lib/auth"
import { termsStatusResponseSchema, type TermsStatusResponse } from "@/lib/schemas/legal"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/**
 * Pages where the gate stays closed: the legal pages themselves (people must
 * be able to read what they're asked to accept) and the auth flow, where the
 * session is still being established.
 */
const EXEMPT_PREFIXES = [
  "/terms",
  "/privacy",
  "/cookies",
  "/login",
  "/signup",
  "/callback",
  "/confirm-email",
  "/confirmed",
  "/forgot-password",
  "/reset-password",
  "/update-password",
  "/set-password",
]

const ACCEPT_TERMS_ENDPOINT = "/api/legal/accept-terms"

async function fetchAcceptance(): Promise<TermsStatusResponse> {
  const res = await fetch(ACCEPT_TERMS_ENDPOINT)
  if (!res.ok) throw new Error("terms status unavailable")
  return termsStatusResponseSchema.parse(await res.json())
}

async function postAcceptance(): Promise<void> {
  const res = await fetch(ACCEPT_TERMS_ENDPOINT, { method: "POST" })
  if (!res.ok) throw new Error("could not record acceptance")
}

/**
 * Non-dismissable modal that asks every signed-in user to accept the current
 * Terms of Use before continuing (docs/archive/COMMUNITY_CONTACT_PLAN.md
 * §12.1). The Terms say acceptance is the volunteer-activity agreement, so
 * without a stored record we can't prove who accepted which version.
 *
 * It fails open on purpose: if the status check errors out, nobody is locked
 * out of the platform by an outage. That's safe because the check only decides
 * whether to *show* the prompt; the acceptance record is what counts.
 */
export function TermsGate() {
  const t = useTranslations("termsGate")
  const { user } = useAuth()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [checked, setChecked] = useState(false)

  const exempt = EXEMPT_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  const queryKey = ["terms-acceptance", user?.id] as const

  const { data } = useQuery({
    queryKey,
    queryFn: fetchAcceptance,
    enabled: !!user && !exempt,
    staleTime: Infinity,
    retry: false,
  })

  const accept = useMutation({
    mutationFn: postAcceptance,
    onSuccess: () => queryClient.setQueryData(queryKey, { accepted: true }),
  })

  const open = !!user && !exempt && data?.accepted === false

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-md [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <ScrollText className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">{t("summaryTitle")}</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>{t("summaryVolunteer")}</li>
            <li>{t("summaryContact")}</li>
            <li>{t("summaryOpenSource")}</li>
          </ul>
          <p className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
            <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
              {t("readTerms")}
            </Link>
            <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
              {t("readPrivacy")}
            </Link>
          </p>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="terms-gate-accept"
            checked={checked}
            onCheckedChange={(value) => setChecked(value === true)}
            className="mt-0.5"
          />
          <Label htmlFor="terms-gate-accept" className="text-sm leading-snug">
            {t("checkbox")}
          </Label>
        </div>

        {accept.isError && (
          <p role="alert" className="text-sm font-semibold text-destructive">
            {t("error")}
          </p>
        )}

        <DialogFooter>
          <Button
            className="w-full sm:w-auto"
            disabled={!checked || accept.isPending}
            onClick={() => accept.mutate()}
          >
            {accept.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("accepting")}
              </>
            ) : (
              t("accept")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
