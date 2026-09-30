"use client"

import { RequireRole } from "@/lib/auth/auth-guard"
import { PageContainer } from "@/components/layout/PageContainer"
import { AdminAppointmentsManager } from "@/components/admin/AdminAppointmentsManager"

/** Gestão de todas as sessões de mentoria: status, reenvio de e-mails e cancelamento. */
export default function AdminAppointmentsPage() {
  return (
    <RequireRole roles={["admin"]}>
      <PageContainer>
        <AdminAppointmentsManager />
      </PageContainer>
    </RequireRole>
  )
}
