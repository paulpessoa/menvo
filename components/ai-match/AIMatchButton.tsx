"use client"

import { useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TextareaWithVoice } from "@/components/ui/textarea-with-voice"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"
import { useRouter } from "@/i18n/routing"
import type { AiQuotaStatus } from "@/lib/ai/quota"

interface AIMatchButtonProps {
  /** Modal heading, e.g. "Buscar mentor com IA". */
  title: string
  /** One-line explanation shown under the heading. */
  description: string
  /** Placeholder that doubles as the hint to type OR speak. */
  placeholder: string
  loading: boolean
  minChars?: number
  loginRequiredMessage: string
  minCharsMessage: string
  submitLabel: string
  quota?: AiQuotaStatus
  quotaHint?: (quota: AiQuotaStatus) => string
  /** Runs the actual search; the modal closes right after this resolves. */
  onSubmit: (query: string) => Promise<void> | void
  /** Compact icon-only trigger for tight layouts (mobile). */
  compact?: boolean
  buttonLabel: string
}

/**
 * Self-contained "Buscar com IA" entry point: a Sparkles button that opens a
 * modal with one big text field (type or speak) instead of sharing the page's
 * literal search box. Splitting it out like this means clicking it never
 * fights with whatever the user already typed in a nearby filter field, and
 * the same component now backs both the mentor search (/mentors) and the
 * community match (/community).
 */
export function AIMatchButton({
  title,
  description,
  placeholder,
  loading,
  minChars = 5,
  loginRequiredMessage,
  minCharsMessage,
  submitLabel,
  quota,
  quotaHint,
  onSubmit,
  compact = false,
  buttonLabel
}: AIMatchButtonProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const { isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()

  const handleOpen = () => {
    if (!isAuthenticated) {
      toast.error(loginRequiredMessage, {
        action: { label: "Entrar", onClick: () => router.push("/login") }
      })
      return
    }
    setOpen(true)
  }

  const handleSubmit = async () => {
    if (query.trim().length < minChars) {
      toast.error(minCharsMessage)
      return
    }
    await onSubmit(query.trim())
    setOpen(false)
  }

  return (
    <>
      <Button
        type="button"
        onClick={handleOpen}
        disabled={authLoading}
        aria-label={buttonLabel}
        className={`h-11 sm:h-12 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shrink-0 ${
          compact ? "px-3 sm:px-4" : "px-4 sm:px-5"
        }`}
      >
        <Sparkles className="h-4 w-4" />
        <span className={compact ? "hidden sm:inline" : ""}>{buttonLabel}</span>
      </Button>

      <Dialog open={open} onOpenChange={(next) => !loading && setOpen(next)}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden gap-0">
          <DialogHeader className="p-6 pb-2 text-left">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <DialogTitle className="text-xl font-black tracking-tight">{title}</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground pt-1.5 leading-relaxed">
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-2">
            <TextareaWithVoice
              value={query}
              onChange={setQuery}
              placeholder={placeholder}
              minHeight="min-h-[140px]"
              className="rounded-2xl text-sm sm:text-base"
            />
            {quota && quota.limit !== null && quota.remaining !== null && quotaHint && (
              <p className="text-xs text-muted-foreground mt-3" aria-live="polite">
                {quotaHint(quota)}
              </p>
            )}
          </div>

          <DialogFooter className="p-6 pt-4 gap-2.5">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl font-semibold"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading || query.trim().length < minChars}
              className="rounded-xl font-semibold gap-1.5"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
