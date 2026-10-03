"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RequireRole } from "@/lib/auth/auth-guard"
import { AdminFeedbackModeration } from "@/components/admin/AdminFeedbackModeration"
import { AdminPlatformFeedback } from "@/components/admin/AdminPlatformFeedback"
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { PageContainer } from "@/components/layout/PageContainer"

const TAB_CLASS =
  "data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-3 bg-transparent font-semibold text-sm md:text-base"

/** Session-rating moderation and general platform feedback, side by side as tabs. */
export default function AdminFeedbacksPage() {
  return (
    <RequireRole roles={["admin"]}>
      <PageContainer>
        <AdminPageHeader
          title="Feedbacks"
          description="Modere avaliações de sessões e acompanhe o que a comunidade diz sobre a plataforma."
        />

        <Tabs defaultValue="sessions" className="space-y-6">
          <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 gap-8">
            <TabsTrigger value="sessions" className={TAB_CLASS}>
              Avaliações de sessões
            </TabsTrigger>
            <TabsTrigger value="platform" className={TAB_CLASS}>
              Voz da comunidade
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Moderação de avaliações</h2>
              <p className="text-sm text-muted-foreground">Aprove depoimentos reais para exibição nos perfis dos mentores.</p>
            </div>
            <AdminFeedbackModeration />
          </TabsContent>

          <TabsContent value="platform" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Feedbacks gerais da plataforma</h2>
              <p className="text-sm text-muted-foreground">Sugestões, críticas e elogios sobre o uso do site.</p>
            </div>
            <AdminPlatformFeedback />
          </TabsContent>
        </Tabs>
      </PageContainer>
    </RequireRole>
  )
}
