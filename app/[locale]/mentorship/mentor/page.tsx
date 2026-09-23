"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link, usePathname, useRouter } from "@/i18n/routing"
import { RequireRole } from "@/lib/auth/auth-guard"
import { useTranslations } from "next-intl"
import { MentorPerspectiveSwitch } from "@/components/mentorship/MentorPerspectiveSwitch"
import { MentorshipBoard } from "@/components/mentorship/MentorshipBoard"
import type { Perspective } from "@/lib/mentorship/group-appointments"

/**
 * Mentor's mentorship screen. A mentor can also book sessions with other
 * mentors, so the page separates "recebidas" (as mentor) from "solicitadas"
 * (as mentee) with a single switch; the chosen side lives in `?view=` so
 * links and reloads land on the same side.
 */
function MentorMentorshipContent() {
    const t = useTranslations("mentorship")
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const perspective: Perspective = searchParams.get("view") === "requested" ? "mentee" : "mentor"

    const setPerspective = (next: Perspective) => {
        router.replace(next === "mentee" ? `${pathname}?view=requested` : pathname, { scroll: false })
    }

    return (
        <div className="container mx-auto max-w-4xl px-4 py-8">
            <Button variant="ghost" asChild className="mb-6 rounded-xl font-medium">
                <Link href="/dashboard/mentor">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("menteePage.backToDashboard")}
                </Link>
            </Button>

            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">{t("title")}</h1>
                    <p className="text-muted-foreground">{t("description")}</p>
                </div>

                <MentorPerspectiveSwitch value={perspective} onChange={setPerspective} />

                <MentorshipBoard key={perspective} perspective={perspective} />
            </div>
        </div>
    )
}

export default function MentorMentorshipPage() {
    return (
        <RequireRole roles={["mentor"]}>
            <Suspense>
                <MentorMentorshipContent />
            </Suspense>
        </RequireRole>
    )
}
