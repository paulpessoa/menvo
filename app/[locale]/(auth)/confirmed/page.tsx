"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"

export default function EmailConfirmedPage() {
  const t = useTranslations("auth.confirmed")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    if (!loading && user && profile) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            handleRedirect()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [loading, user, profile, router])

  const handleRedirect = () => {
    if (!profile) return

    if (!profile.roles || profile.roles.length === 0) {
      router.push("/select-role")
    } else if (profile.verification_status === "pending") {
      router.push("/profile?complete=true")
    } else {
      router.push("/dashboard")
    }
  }

  const getRedirectMessage = () => {
    if (!profile) return tCommon("loading")

    if (!profile.roles || profile.roles.length === 0) {
      return t("messages.role")
    } else if (profile.verification_status === "pending") {
      return t("messages.profile")
    } else {
      return t("messages.dashboard")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">{tCommon("loading")}</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">
            {t("title")}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {t("description")}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              {tCommon("welcome")}, <strong>{profile?.full_name || user.email}</strong>!
            </p>
            <p className="text-sm text-gray-500">
              {getRedirectMessage()}
            </p>
          </div>

          {countdown > 0 && (
            <div className="text-center">
              <p className="text-sm text-gray-400">
                {t("redirecting", { count: countdown })}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleRedirect}
              className="w-full"
            >
              {t("continueNow")}
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="w-full"
            >
              {tCommon("home")}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-400">
              {t("help")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
