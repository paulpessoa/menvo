"use client"

import { useState, useEffect } from 'react'
import { AlertTriangle, X, Star } from 'lucide-react'
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
  const [showBanner, setShowBanner] = useState(false)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)

  useEffect(() => {
    const hasSeenWarning = sessionStorage.getItem('hasSeenWarning')
    if (!hasSeenWarning) {
      setShowBanner(true)
    }
  }, [])

  const handleDismiss = () => {
    sessionStorage.setItem('hasSeenWarning', 'true')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <>
      {/* Floating Warning Banner */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
        <div className="bg-yellow-100 border border-yellow-300 rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-800 flex-shrink-0 pr-1" />
              <p className="text-yellow-800 text-sm md:text-base">{t('warning.message')}</p>
            </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-yellow-800 hover:bg-yellow-200"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
           </div>
        </div>
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
