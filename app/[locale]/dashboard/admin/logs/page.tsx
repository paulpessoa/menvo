"use client"

import { RequireRole } from "@/lib/auth/auth-guard"
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { ActivityLogsTable } from "@/components/admin/ActivityLogsTable"
import { PageContainer } from "@/components/layout/PageContainer"

/** Trail of what users change on their own data, searchable. */
export default function AdminLogsPage() {
  return (
    <RequireRole roles={["admin"]}>
      <PageContainer>
        <AdminPageHeader
          title="Logs de atividade"
          description="Tudo que os usuários atualizam: perfil, disponibilidade, papéis e sessões. Registros a partir de hoje."
        />
        <ActivityLogsTable />
      </PageContainer>
    </RequireRole>
  )
}
