'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Video } from "lucide-react"
import { Link } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import { MentorshipBoard } from "./MentorshipBoard"

/**
 * Mentee mentorship screen: the lifecycle board (action → upcoming → history)
 * plus a short "how sessions work" guide.
 *
 * The old static hero ("você tem uma sessão agendada em breve") was removed —
 * it showed even with zero sessions. The board's NextSessionCard now shows the
 * real next session, only when one exists.
 */
export function MenteeMentorshipNewUX() {
    const t = useTranslations("mentorship.hub")

    return (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <MentorshipBoard perspective="mentee" />
            </div>

            <aside className="space-y-4">
                <Card className="overflow-hidden rounded-2xl border-primary/20">
                    <div className="h-1.5 bg-primary" />
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base font-bold">
                            <Video className="h-5 w-5 text-primary" />
                            {t("howItWorksTitle")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                        <p>{t("howItWorksMeet")}</p>
                        <p className="text-xs">{t("howItWorksTip")}</p>
                    </CardContent>
                </Card>

                <Button asChild className="h-11 w-full font-bold">
                    <Link href="/mentors">{t("exploreMentors")}</Link>
                </Button>
            </aside>
        </div>
    );
}
