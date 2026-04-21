"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Loader2, CheckCircle, AlertTriangle, UserPlus } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"
import { useTranslations } from "next-intl"

export default function SetPasswordPage() {
    const t = useTranslations("auth.setPassword")
    const tRegister = useTranslations("register")
    const tCommon = useTranslations("common")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [isValidSession, setIsValidSession] = useState(false)
    const [checkingSession, setCheckingSession] = useState(true)
    const [userEmail, setUserEmail] = useState("")

    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()

                if (session?.user) {
                    setIsValidSession(true)
                    setUserEmail(session.user.email || "")
                } else {
                    setError(t("invalidInvite"))
                }
            } catch (error) {
                setError(tCommon("error"))
            } finally {
                setCheckingSession(false)
            }
        }

        checkSession()
    }, [supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        if (password !== confirmPassword) {
            setError(tRegister("passwordValidation.passwordsDontMatch"))
            setIsLoading(false)
            return
        }

        if (password.length < 6) {
            setError(tRegister("passwordValidation.passwordTooShort"))
            setIsLoading(false)
            return
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) {
                setError(error.message || tCommon("error"))
            } else {
                setSuccess(true)
                setTimeout(() => {
                    router.push("/select-role")
                }, 3000)
            }
        } catch (error) {
            setError(tCommon("error"))
        } finally {
            setIsLoading(false)
        }
    }

    if (checkingSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-foreground">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-gray-600">{t("checkingSession")}</p>
                </div>
            </div>
        )
    }

    if (!isValidSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 text-foreground">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <CardTitle>{t("invalidInvite")}</CardTitle>
                        <CardDescription>
                            {t("invalidInviteDesc")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button asChild className="w-full">
                            <Link href="/signup">
                                {tRegister("signupTitle")}
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/login">
                                {tCommon("login")}
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 text-foreground">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle>{t("successTitle")}</CardTitle>
                        <CardDescription>
                            {t("successDescription")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-4">
                                {t("redirecting")}
                            </p>
                            <div className="animate-pulse text-sm text-blue-600">
                                {t("redirecting")}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button asChild className="w-full">
                            <Link href="/select-role">
                                {tCommon("continue")}
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 text-foreground">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <UserPlus className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-center">{tCommon("welcome")}!</CardTitle>
                    <CardDescription className="text-center">
                        {t("description")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {userEmail && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-800">
                                <strong>{tCommon("email")}:</strong> {userEmail}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="password">{tRegister("password")}</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder={tRegister("passwordPlaceholder")}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">{tRegister("confirmPassword")}</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder={tRegister("confirmPasswordPlaceholder")}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {tCommon("saving")}
                                </>
                            ) : (
                                t("button")
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter>
                    <div className="w-full text-center">
                        <p className="text-xs text-muted-foreground">
                            {t("agreement")}{" "}
                            <Link href="/terms" className="text-blue-600 hover:underline">
                                {tCommon("terms")}
                            </Link>{" "}
                            {tCommon("and")}{" "}
                            <Link href="/privacy" className="text-blue-600 hover:underline">
                                {tCommon("privacy")}
                            </Link>
                        </p>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
