"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { UserTypeSelector } from "@/components/auth/UserTypeSelector"
import type { UserType } from "@/hooks/useSignupForm"
import { toast } from "sonner"

interface WaitingListProps {
  isOpen: boolean
  onClose: () => void
}

export function WaitingList({ isOpen, onClose }: WaitingListProps) {
  const { t } = useTranslation()
  const supabase = createClientComponentClient()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [reason, setReason] = useState("")
  const [userType, setUserType] = useState<UserType>("mentee")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { error } = await supabase.from("waiting_list").insert([
        {
          name,
          email,
          whatsapp: whatsapp || null,
          reason,
          user_type: userType,
        },
      ])

      if (error) throw error

      toast.success(t("waitingList.successMessage") || "Thank you for your interest!")
      setName("")
      setEmail("")
      setWhatsapp("")
      setReason("")
      setUserType("mentee")
      onClose()
    } catch (error: any) {
      toast.error(error.message || t("waitingList.errorMessage") || "Error submitting form")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("waitingList.title") || "Join the Waiting List"}</DialogTitle>
          <DialogDescription>
            {t("waitingList.description") ||
              "Thank you for your interest! Please fill out the form below."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("waitingList.nameLabel") || "Name"}</Label>
            <Input
              id="name"
              type="text"
              placeholder={t("waitingList.namePlaceholder") || "Enter your full name"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("common.email") || "Email"}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("waitingList.emailPlaceholder") || "your@email.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">{t("waitingList.whatsappLabel") || "WhatsApp (optional)"}</Label>
            <Input
              id="whatsapp"
              type="text"
              placeholder={t("waitingList.whatsappPlaceholder") || "Your WhatsApp number"}
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">{t("waitingList.reasonLabel") || "Why do you want to be part?"}</Label>
            <Textarea
              id="reason"
              placeholder={t("waitingList.reasonPlaceholder") || "Tell us why you want to join"}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={4}
            />
          </div>

          <UserTypeSelector userType={userType} setUserType={setUserType} />

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? t("common.submitting") || "Submitting..." : t("common.submit") || "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}