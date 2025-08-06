"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { XIcon } from 'lucide-react'
import { Star, MessageSquare } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function FeedbackBanner() {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const supabase = createClientComponentClient()
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) {
    return null
  }

  const handleSubmit = async () => {
    if (!rating) {
      toast({
        title: t('feedback.ratingRequired'),
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('feedback')
        .insert([
          {
            rating,
            comment,
            email: isAuthenticated ? undefined : email,
            user_id: isAuthenticated ? (await supabase.auth.getUser()).data.user?.id : undefined,
          },
        ])

      if (error) throw error

      setShowThankYou(true)
      setRating(null)
      setComment('')
      setEmail('')
    } catch (error) {
      toast({
        title: t('feedback.error'),
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setShowThankYou(false)
  }

  return (
    <>
      {/* Floating Button with Tooltip */}
      <div className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-lg shadow-lg flex items-center gap-4 max-w-sm">
        <p className="text-sm">
          Estamos em fase de testes! Sua opinião é muito importante para nós.
        </p>
        <a href="https://forms.gle/your-feedback-form-link" target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" size="sm" className="text-blue-600">
            Enviar Feedback
          </Button>
        </a>
        <Button variant="ghost" size="icon" onClick={() => setIsVisible(false)} className="text-white hover:bg-blue-700">
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </Button>
      </div>

      {/* Feedback Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          {showThankYou ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-center text-2xl">🎉</DialogTitle>
                <DialogDescription className="text-center text-lg">
                  {t('feedback.thankYou')}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={handleClose} className="w-full">
                  {t('common.close')}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{t('feedback.title')}</DialogTitle>
                <DialogDescription>
                  {t('feedback.description')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      variant="ghost"
                      size="icon"
                      onClick={() => setRating(star)}
                      className={`h-8 w-8 ${
                        rating && star <= rating
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                      aria-label={t('feedback.rateStars', { count: star })}
                    >
                      <Star className="h-5 w-5" />
                    </Button>
                  ))}
                </div>

                <Textarea
                  placeholder={t('feedback.commentPlaceholder')}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[100px]"
                />

                {!isAuthenticated && (
                  <Input
                    type="email"
                    placeholder={t('feedback.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? t('common.submitting') : t('feedback.submit')}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
