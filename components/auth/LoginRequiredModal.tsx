"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Lock, UserPlus, LogIn } from "lucide-react"
import Link from "next/link"
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">
            {t("mentors.loginRequired.title")}
          </DialogTitle>
          <DialogDescription className="text-base">
            {mentorName 
              ? t("mentors.loginRequired.descriptionWithName", { mentorName })
              : t("mentors.loginRequired.description")
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              {t("mentors.loginRequired.benefits.title")}
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• {t("mentors.loginRequired.benefits.item1")}</li>
              <li>• {t("mentors.loginRequired.benefits.item2")}</li>
              <li>• {t("mentors.loginRequired.benefits.item3")}</li>
              <li>• {t("mentors.loginRequired.benefits.item4")}</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/signup">
              <UserPlus className="mr-2 h-4 w-4" />
              {t("mentors.loginRequired.signUp")}
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" />
              {t("mentors.loginRequired.login")}
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 