"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Calendar, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Link, usePathname, useRouter } from "@/i18n/routing"
import { RequireRole } from "@/lib/auth/auth-guard"
import { MentorshipBoard } from "@/components/mentorship/MentorshipBoard"
import { SharedDiagnosticsSection } from "@/components/diagnostic/SharedDiagnosticsSection"

/**
 * Mentor Appointments & Shared Diagnostics screen.
 * Allows mentors to manage their sessions and view diagnostics shared by mentees.
 */
function MentorAppointmentsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const currentTab = searchParams.get("tab") || "appointments"
  const [tab, setTab] = useState(currentTab)

  useEffect(() => {
    setTab(searchParams.get("tab") || "appointments")
  }, [searchParams])

  const handleTabChange = (nextTab: string) => {
    setTab(nextTab)
    router.replace(nextTab === "appointments" ? pathname : `${pathname}?tab=${nextTab}`, {
      scroll: false
    })
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Button variant="ghost" asChild className="mb-6 rounded-xl font-medium">
        <Link href="/dashboard/mentor">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </Link>
      </Button>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Minhas Mentorias</h1>
          <p className="text-muted-foreground">
            Acompanhe suas sessões com mentorados e os diagnósticos compartilhados com você.
          </p>
        </div>

        <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 rounded-xl">
            <TabsTrigger value="appointments" className="flex items-center gap-2 rounded-lg">
              <Calendar className="h-4 w-4" />
              Sessões Agendadas
            </TabsTrigger>
            <TabsTrigger value="shares" className="flex items-center gap-2 rounded-lg">
              <Sparkles className="h-4 w-4" />
              Diagnósticos Compartilhados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-6">
            <MentorshipBoard perspective="mentor" />
          </TabsContent>

          <TabsContent value="shares" className="space-y-6">
            <SharedDiagnosticsSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function MentorAppointmentsPage() {
  return (
    <RequireRole roles={["mentor"]}>
      <Suspense>
        <MentorAppointmentsContent />
      </Suspense>
    </RequireRole>
  )
}
