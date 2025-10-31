"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Cookie, X, Settings } from "lucide-react"
import Link from "next/link"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface CookiePreferences {
    necessary: boolean
    analytics: boolean
    functional: boolean
}

declare global {
    interface Window {
        clarity?: (action: string, ...args: any[]) => void
    }
}

export function CookieConsentBanner() {
    const { t } = useTranslation()
    const [showBanner, setShowBanner] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [preferences, setPreferences] = useState<CookiePreferences>({
        necessary: true, // Always true
        analytics: false,
        functional: false,
    })

    useEffect(() => {
        // Check if user has already made a choice
        const consent = localStorage.getItem("cookie-consent")
        if (!consent) {
            // Show banner after a short delay
            setTimeout(() => setShowBanner(true), 1000)
        } else {
            // Apply saved preferences
            const savedPreferences = JSON.parse(consent)
            setPreferences(savedPreferences)
            applyClarityConsent(savedPreferences.analytics)
        }
    }, [])

    const applyClarityConsent = (analyticsConsent: boolean) => {
        // Send consent signal to Microsoft Clarity
        if (typeof window !== "undefined" && window.clarity) {
            try {
                // Use Clarity Consent API
                window.clarity("consent", analyticsConsent)
                console.log("[Clarity] Consent signal sent:", analyticsConsent)
            } catch (error) {
                console.error("[Clarity] Error sending consent:", error)
            }
        }
    }

    const savePreferences = (prefs: CookiePreferences) => {
        localStorage.setItem("cookie-consent", JSON.stringify(prefs))
        localStorage.setItem("cookie-consent-date", new Date().toISOString())
        setPreferences(prefs)
        applyClarityConsent(prefs.analytics)
        setShowBanner(false)
        setShowSettings(false)
    }

    const acceptAll = () => {
        const allAccepted: CookiePreferences = {
            necessary: true,
            analytics: true,
            functional: true,
        }
        savePreferences(allAccepted)
    }

    const acceptNecessary = () => {
        const necessaryOnly: CookiePreferences = {
            necessary: true,
            analytics: false,
            functional: false,
        }
        savePreferences(necessaryOnly)
    }

    const saveCustomPreferences = () => {
        savePreferences(preferences)
    }

    if (!showBanner) return null

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/50 to-transparent pointer-events-none">
                <Card className="max-w-4xl mx-auto p-6 shadow-2xl pointer-events-auto">
                    <div className="flex items-start gap-4">
                        <Cookie className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-2">
                                {t("cookieConsent.title")}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                {t("cookieConsent.description")}{" "}
                                <Link
                                    href="/cookies"
                                    className="underline hover:text-foreground"
                                >
                                    {t("cookieConsent.learnMore")}
                                </Link>
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <Button onClick={acceptAll} size="sm">
                                    {t("cookieConsent.acceptAll")}
                                </Button>
                                <Button onClick={acceptNecessary} variant="outline" size="sm">
                                    {t("cookieConsent.acceptNecessary")}
                                </Button>
                                <Button
                                    onClick={() => setShowSettings(true)}
                                    variant="ghost"
                                    size="sm"
                                >
                                    <Settings className="h-4 w-4 mr-2" />
                                    {t("cookieConsent.customize")}
                                </Button>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={acceptNecessary}
                            className="flex-shrink-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>
            </div>

            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t("cookieConsent.settings.title")}</DialogTitle>
                        <DialogDescription>
                            {t("cookieConsent.settings.description")}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Necessary Cookies */}
                        <div className="flex items-start justify-between gap-4 pb-4 border-b">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Label className="text-base font-semibold">
                                        {t("cookieConsent.settings.necessary.title")}
                                    </Label>
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                        {t("cookieConsent.settings.alwaysActive")}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {t("cookieConsent.settings.necessary.description")}
                                </p>
                            </div>
                            <Switch checked={true} disabled />
                        </div>

                        {/* Analytics Cookies */}
                        <div className="flex items-start justify-between gap-4 pb-4 border-b">
                            <div className="flex-1">
                                <Label className="text-base font-semibold mb-2 block">
                                    {t("cookieConsent.settings.analytics.title")}
                                </Label>
                                <p className="text-sm text-muted-foreground mb-2">
                                    {t("cookieConsent.settings.analytics.description")}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {t("cookieConsent.settings.analytics.tools")}
                                </p>
                            </div>
                            <Switch
                                checked={preferences.analytics}
                                onCheckedChange={(checked) =>
                                    setPreferences({ ...preferences, analytics: checked })
                                }
                            />
                        </div>

                        {/* Functional Cookies */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <Label className="text-base font-semibold mb-2 block">
                                    {t("cookieConsent.settings.functional.title")}
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    {t("cookieConsent.settings.functional.description")}
                                </p>
                            </div>
                            <Switch
                                checked={preferences.functional}
                                onCheckedChange={(checked) =>
                                    setPreferences({ ...preferences, functional: checked })
                                }
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t">
                        <Button variant="outline" onClick={acceptNecessary}>
                            {t("cookieConsent.acceptNecessary")}
                        </Button>
                        <Button onClick={saveCustomPreferences}>
                            {t("cookieConsent.savePreferences")}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
