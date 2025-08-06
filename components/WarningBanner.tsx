"use client"

import { useState, useEffect } from 'react'
import { AlertTriangleIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

export function WarningBanner() {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(true)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)

  useEffect(() => {
    const hasSeenWarning = sessionStorage.getItem('hasSeenWarning')
    if (!hasSeenWarning) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [])

  const handleDismiss = () => {
    sessionStorage.setItem('hasSeenWarning', 'true')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <>
      {/* Floating Warning Banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white p-3 flex items-center justify-center gap-4 text-sm">
        <AlertTriangleIcon className="h-5 w-5 flex-shrink-0" />
        <p className="text-center">
          Este é um projeto de código aberto em desenvolvimento. Não insira dados sensíveis.
        </p>
        <Button variant="ghost" size="icon" onClick={handleDismiss} className="text-white hover:bg-yellow-600">
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </Button>
      </div>

      {/* Feedback Dialog */}
      <AlertDialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('feedback.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('feedback.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowFeedbackDialog(false)
                window.dispatchEvent(new CustomEvent('openFeedback'))
              }}
            >
              {t('feedback.openFeedback')}
            </Button>
            <AlertDialogAction onClick={() => setShowFeedbackDialog(false)}>
              {t('common.close')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
