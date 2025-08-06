"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Lock } from 'lucide-react'
import { useTranslation } from "react-i18next"

interface LoginRequiredModalProps {
  isOpen: boolean
  onClose: () => void
  mentorName?: string
}

export function LoginRequiredModal({ isOpen, onClose, mentorName }: LoginRequiredModalProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] text-center">
        <DialogHeader className="items-center">
          <Lock className="h-12 w-12 text-primary mb-4" />
          <DialogTitle className="text-2xl">{t('loginRequiredModal.title')}</DialogTitle>
          <DialogDescription className="text-base">
            {mentorName
              ? t('loginRequiredModal.descriptionWithName', { mentorName })
              : t('loginRequiredModal.descriptionGeneric')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-center gap-3 pt-4">
          <Link href="/login" passHref>
            <Button className="w-full sm:w-auto" onClick={onClose}>
              {t('loginRequiredModal.loginButton')}
            </Button>
          </Link>
          <Link href="/signup" passHref>
            <Button variant="outline" className="w-full sm:w-auto" onClick={onClose}>
              {t('loginRequiredModal.signupButton')}
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
