"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, CheckCircle, AlertCircle } from "lucide-react"
import { useNewsletterUnsubscribe } from "@/hooks/useNewsletter"
import { useTranslations } from "next-intl"
import Link from "next/link"

export default function UnsubscribePage() {
  const t = useTranslations("newsletter.unsubscribe")
  const tCommon = useTranslations("common")
  const [email, setEmail] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  
  const unsubscribeMutation = useNewsletterUnsubscribe()

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await unsubscribeMutation.mutateAsync(email)
      setIsSuccess(true)
    } catch (error) {
      // Error is handled by the hook
    }
  }

  if (isSuccess) {
    return (
      <div className="container max-w-md py-16 flex flex-col items-center text-center">
        <Card>
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle>{t("successTitle")}</CardTitle>
            <CardDescription>
              {t("successDescription")} 😢
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("rejoinText")}
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                asChild
              >
                <Link href="/">{t("backToSite")}</Link>
              </Button>
              <Button 
                className="flex-1"
                onClick={() => {
                  setIsSuccess(false)
                  setEmail("")
                }}
              >
                {t("rejoinButton")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-md py-16 text-foreground">
      <Card>
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Mail className="h-12 w-12 text-primary" />
          </div>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>
            {t("description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUnsubscribe} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{tCommon("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">{t("considerTitle")}</p>
                  <ul className="mt-1 space-y-1 text-xs text-left list-disc list-inside">
                    <li>{t("considerItem1")}</li>
                    <li>{t("considerItem2")}</li>
                    <li>{t("considerItem3")}</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              variant="destructive"
              className="w-full"
              disabled={!email.includes('@') || unsubscribeMutation.isPending}
            >
              {unsubscribeMutation.isPending ? t("cancelling") : t("button")}
            </Button>
            
            <Button 
              type="button" 
              variant="outline"
              className="w-full"
              asChild
            >
              <Link href="/">{t("backToSite")}</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
