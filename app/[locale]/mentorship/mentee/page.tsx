"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Link } from "@/i18n/routing"
import { RequireRole } from "@/lib/auth/auth-guard"
import { MenteeMentorshipNewUX } from "@/components/mentorship/MenteeMentorshipNewUX"
import { useTranslations } from "next-intl"

/**
 * Página de visualização e gestão de mentorias do mentorado.
 * Renderiza permanentemente o layout moderno com banner de boas-vindas, timeline e orientações.
 */
export default function MenteeMentorshipPage() {
    const t = useTranslations("mentorship")

    return (
        <RequireRole roles={['mentee']}>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <Button variant="ghost" asChild className="rounded-xl font-medium">
                        <Link href="/dashboard/mentee">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            {t("menteePage.backToDashboard")}
                        </Link>
                    </Button>
                </div>

                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold">{t("menteePage.title")}</h1>
                        <p className="text-muted-foreground">
                            {t("menteePage.description")}
                        </p>
                    </div>

                    {/* Interface moderna definitiva */}
                    <MenteeMentorshipNewUX />
                </div>
            </div>
        </RequireRole>
    )
}

