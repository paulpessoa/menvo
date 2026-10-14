"use client"

import { useState, useEffect } from "react"
import { Bell, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

interface AvailabilityAlertButtonProps {
  mentorId: string
  mentorName: string
  variant?: "default" | "outline" | "secondary"
  className?: string
  size?: "default" | "sm" | "lg" | "xl"
}

export function AvailabilityAlertButton({
  mentorId,
  mentorName,
  variant = "default",
  className = "",
  size = "default",
}: AvailabilityAlertButtonProps) {
  const t = useTranslations("mentorship.booking")
  const { user } = useAuth()
  const [hasAlert, setHasAlert] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [emailInput, setEmailInput] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user?.id || !mentorId) return
    let active = true
    fetch(`/api/mentors/availability-alerts?mentor_id=${mentorId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.hasActiveAlert) setHasAlert(true)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [user?.id, mentorId])

  const subscribeWithEmail = async (email?: string) => {
    try {
      setSubmitting(true)
      const res = await fetch("/api/mentors/availability-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentor_id: mentorId, email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao registrar interesse")

      setHasAlert(true)
      setIsModalOpen(false)
      toast.success(t("notifyMeSuccess"))
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar interesse")
    } finally {
      setSubmitting(false)
      setLoading(false)
    }
  }

  const handleClick = () => {
    if (hasAlert) return toast.info(t("notifyMeSuccess"))
    if (user) {
      setLoading(true)
      subscribeWithEmail()
    } else {
      setIsModalOpen(true)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={hasAlert ? "outline" : variant}
        size={size}
        onClick={handleClick}
        disabled={loading}
        className={`rounded-xl transition-all font-semibold flex items-center gap-2 ${
          hasAlert ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100" : ""
        } ${className}`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : hasAlert ? (
          <Check className="w-4 h-4 text-emerald-600" />
        ) : (
          <Bell className="w-4 h-4" />
        )}
        <span>{hasAlert ? t("notifyMeActive") : t("notifyMe")}</span>
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader className="text-left space-y-2">
            <DialogTitle className="text-lg font-bold">{t("notifyMeModalTitle")}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {t("notifyMeModalDesc", { name: mentorName })}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (emailInput.trim()) subscribeWithEmail(emailInput.trim())
            }}
            className="space-y-4 pt-2"
          >
            <Input
              type="email"
              required
              placeholder={t("notifyMeEmailPlaceholder")}
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="rounded-xl"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl">
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting || !emailInput.trim()} className="rounded-xl">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {submitting ? t("notifyMeSubmitting") : t("notifyMeSubmit")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
