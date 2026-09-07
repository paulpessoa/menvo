"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Mail, Shield, Users, Phone, CheckCircle, Heart } from "lucide-react"
import { useNewsletterSubscribe } from "@/hooks/useNewsletter"
import { useTranslations } from "next-intl"

interface NewsletterModalProps {
  isOpen: boolean
  onClose: () => void
  initialEmail?: string
  onEmailClear?: () => void
}

export function NewsletterModal({ isOpen, onClose, initialEmail = "", onEmailClear }: NewsletterModalProps) {
  const t = useTranslations("newsletter.modal")
  const [email, setEmail] = useState(initialEmail)
  const [name, setName] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [consentGiven, setConsentGiven] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  const subscribeMutation = useNewsletterSubscribe()

  // Atualizar email quando initialEmail mudar
  useEffect(() => {
    setEmail(initialEmail)
  }, [initialEmail])

  const handleClose = () => {
    // Reset form
    setEmail("")
    setName("")
    setWhatsapp("")
    setConsentGiven(false)
    setMarketingConsent(false)
    setShowSuccessMessage(false)
    
    // Limpar email do input externo
    if (onEmailClear) {
      onEmailClear()
    }
    
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!consentGiven) {
      return
    }

    try {
      await subscribeMutation.mutateAsync({
        email,
        name: name.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        consent_given: consentGiven
      })
      
      // Mostrar mensagem de sucesso
      setShowSuccessMessage(true)
      
    } catch (error) {
      // Error is handled by the hook
    }
  }

  const isValid = email.includes('@') && consentGiven

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {showSuccessMessage ? (
          // Tela de Sucesso
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <DialogTitle className="text-center text-xl">{t("success.title")}</DialogTitle>
            </DialogHeader>
              <div className="text-center space-y-3">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>{t("success.receive")}</strong>
                  </p>
                  <ul className="text-xs text-blue-700 mt-2 space-y-1">
                    <li>{t("success.news")}</li>
                    <li>{t("success.tips")}</li>
                    <li>{t("success.features")}</li>
                    {whatsapp && <li>{t("success.whatsapp")}</li>}
                  </ul>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span>{t("success.madeWithLove")}</span>
                </div>
              </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                {t("success.continue")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Tela do Formulário
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                {t("form.title")}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newsletter-email">{t("form.emailLabel")}</Label>
                <Input
                  id="newsletter-email"
                  type="email"
                  placeholder={t("form.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newsletter-name">{t("form.nameLabel")}</Label>
                <Input
                  id="newsletter-name"
                  type="text"
                  placeholder={t("form.namePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newsletter-whatsapp" className="flex items-center gap-2">
                  {t("form.whatsappLabel")}
                </Label>
                <Input
                  id="newsletter-whatsapp"
                  type="tel"
                  placeholder={t("form.whatsappPlaceholder")}
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {t("form.whatsappInfo")}
                </p>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="consent-required"
                    checked={consentGiven}
                    onCheckedChange={(checked) => setConsentGiven(checked as boolean)}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="consent-required" className="text-sm font-medium">
                      {t("form.consentLabel")}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t("form.consentInfo")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="marketing-consent"
                    checked={marketingConsent}
                    onCheckedChange={(checked) => setMarketingConsent(checked as boolean)}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="marketing-consent" className="text-sm font-medium">
                      {t("form.marketingLabel")}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t("form.marketingInfo")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/80 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{t("form.dataProtectionTitle")}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("form.dataProtectionInfo")}
                </p>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="w-full sm:w-auto"
                >
                  {t("form.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={!isValid || subscribeMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {subscribeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("form.subscribing")}
                    </>
                  ) : (
                    <>
                      <Users className="mr-2 h-4 w-4" />
                      {t("form.subscribe")}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
