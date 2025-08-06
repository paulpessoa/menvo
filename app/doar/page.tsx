'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DollarSignIcon, HeartHandshakeIcon, MailIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from '@/components/ui/use-toast'
import { useTranslation } from 'react-i18next'

export default function DonatePage() {
  const { t } = useTranslation()
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setLoading(false)

    toast({
      title: t('donate.toastSuccessTitle'),
      description: t('donate.toastSuccessDescription'),
      variant: 'default',
    })

    // Reset form
    setAmount('')
    setMessage('')
    setEmail('')
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="text-center space-y-1">
          <HeartHandshakeIcon className="mx-auto h-16 w-16 text-primary" />
          <CardTitle className="text-3xl font-bold">{t('donate.title')}</CardTitle>
          <CardDescription className="text-lg">
            {t('donate.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('donate.whyDonate.title')}</h2>
            <p className="text-muted-foreground">
              {t('donate.whyDonate.paragraph1')}
            </p>
            <p className="text-muted-foreground mt-2">
              {t('donate.whyDonate.paragraph2')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('donate.howYourDonationHelps.title')}</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>{t('donate.howYourDonationHelps.item1')}</li>
              <li>{t('donate.howYourDonationHelps.item2')}</li>
              <li>{t('donate.howYourDonationHelps.item3')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('donate.makeADonation.title')}</h2>
            <form onSubmit={handleDonate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">{t('donate.amountLabel')}</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="50.00"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('donate.emailLabel')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">{t('donate.messageLabel')}</Label>
                <Textarea
                  id="message"
                  placeholder={t('donate.messagePlaceholder')}
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    {t('donate.loadingButton')}
                  </>
                ) : (
                  <>
                    <DollarSignIcon className="mr-2 h-4 w-4" />
                    {t('donate.donateButton')}
                  </>
                )}
              </Button>
            </form>
          </section>

          <section className="text-center text-muted-foreground text-sm">
            <p>{t('donate.contactUs')}</p>
            <p className="flex items-center justify-center gap-1 mt-2">
              <MailIcon className="h-4 w-4" />
              <a href="mailto:contact@menvo.org" className="underline">contact@menvo.org</a>
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
