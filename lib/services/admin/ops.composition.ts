/**
 * Camada 7 · Composição do painel admin (linha L2)
 * Regra: o único lugar que cria o client `service_role` do painel (ADR 0008 E7,
 * ADR 0009), de forma preguiçosa: só nasce quando o service o pede, depois do
 * `assertAdmin`. As rotas só chamam os `build*`.
 * Não faz: regra de negócio (é dos services).
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { logAdminAction } from "@/lib/audit-logger"
import { createOrganizationsRepository } from "@/lib/repositories/organizations.repository"
import { brevoAdminEmail } from "@/lib/ports/adapters/admin-email.brevo"
import { resolveAudience } from "@/lib/services/invites/audience.service"
import { createInviteToken } from "@/lib/services/invites/invite-token.service"
import {
  createAdminFeatureFlagsRepository,
  createAdminFeedbacksRepository,
  createAdminInvitesRepository,
  createAdminOrganizationsRepository,
  createAdminOrgLeadsRepository,
  createAdminRetentionReadRepository,
  createAdminRetentionWriteRepository
} from "@/lib/repositories/admin-ops.repository"
import { brevoAppointmentMailer } from "@/lib/ports/adapters/appointment-mailer.brevo"
import { googleAppointmentCalendar } from "@/lib/ports/adapters/appointment-calendar.google"
import type { AdminAppointmentsDeps } from "@/lib/services/appointments/admin-appointments.service"
import { getAdminOverview } from "./overview.service"
import { createAdminRetentionService } from "./retention.service"
import { createAdminFeatureFlagsService } from "./feature-flags.service"
import { createAdminFeedbacksService } from "./feedbacks.service"
import { sendMentorNewReviewNotification } from "@/lib/email/brevo"
import { createAdminOrganizationsService } from "./organizations.service"
import { createAdminInvitesService } from "./invites.service"
import { createAdminEmailsService } from "./emails.service"

function lazyPrivilegedClient() {
  let client: SupabaseClient<Database> | null = null
  return () => (client ??= createServiceRoleClient() as SupabaseClient<Database>)
}

/**
 * Visão geral do painel: tudo pela sessão do admin, menos `appointments`, que
 * usa o client privilegiado (lazy, só depois do `assertAdmin`).
 */
export function loadAdminOverview(sessionDb: SupabaseClient<Database>) {
  return getAdminOverview(sessionDb, lazyPrivilegedClient())
}

/** Service de retenção: leituras pela sessão, isenção pelo client privilegiado. */
export function buildAdminRetentionService(sessionDb: SupabaseClient<Database>) {
  const privileged = lazyPrivilegedClient()
  return createAdminRetentionService({
    sessionDb,
    reads: createAdminRetentionReadRepository(sessionDb),
    writes: () => createAdminRetentionWriteRepository(privileged()),
    // O tipo de ação ainda não tem nome próprio (audit-logger é compartilhado).
    audit: (adminId, details, targetUserId) =>
      logAdminAction(adminId, "user_status_changed", details, targetUserId)
  })
}

/**
 * Dependências do painel de sessões (L2-4): client privilegiado lazy (nasce
 * só depois do `assertAdmin` do service) e os adapters de e-mail e Calendar
 * que o módulo de appointments já usa.
 */
export function buildAdminAppointmentsDeps(
  sessionDb: SupabaseClient<Database>
): AdminAppointmentsDeps {
  return {
    sessionDb,
    db: lazyPrivilegedClient(),
    mailer: brevoAppointmentMailer,
    calendar: googleAppointmentCalendar
  }
}

/**
 * Service de organizações e pedidos de org do painel (L2-6): tudo pela sessão
 * do admin (policies de admin existem), então não nasce client `service_role`.
 */
export function buildAdminOrganizationsService(sessionDb: SupabaseClient<Database>) {
  return createAdminOrganizationsService({
    sessionDb,
    repo: createAdminOrganizationsRepository(sessionDb),
    orgs: createOrganizationsRepository(sessionDb),
    leads: createAdminOrgLeadsRepository(sessionDb)
  })
}

/**
 * Service de convites de reengajamento (L2-7, E7): audiência, token e escrita
 * em `import_records` pelo client privilegiado lazy; e-mail pelo port Brevo.
 * `request` (se vier) entra na trilha com IP e user agent.
 */
export function buildAdminInvitesService(
  sessionDb: SupabaseClient<Database>,
  request?: Request
) {
  const privileged = lazyPrivilegedClient()
  return createAdminInvitesService({
    sessionDb,
    repo: () => createAdminInvitesRepository(privileged()),
    audience: params => resolveAudience(params, privileged()),
    createToken: params => createInviteToken(params, privileged()),
    mailer: brevoAdminEmail,
    audit: (adminId, details) =>
      logAdminAction(adminId, "bulk_action", details, undefined, undefined, request),
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://www.menvo.com.br"
  })
}

/** Service dos modelos de e-mail do painel (L2-7): só sessão e port, sem banco. */
export function buildAdminEmailsService(sessionDb: SupabaseClient<Database>) {
  return createAdminEmailsService({ sessionDb, mailer: brevoAdminEmail })
}

/** Service de feature flags (E7 por ora): escreve pelo client privilegiado lazy. */
export function buildAdminFeatureFlagsService(sessionDb: SupabaseClient<Database>) {
  const privileged = lazyPrivilegedClient()
  return createAdminFeatureFlagsService({
    sessionDb,
    repo: () => createAdminFeatureFlagsRepository(privileged())
  })
}

/**
 * Service de moderação de avaliações (L2-8): tudo pela sessão do admin (sem
 * `service_role`); e-mail ao mentor pelo Brevo e auditoria em `admin_audit_logs`.
 */
export function buildAdminFeedbacksService(sessionDb: SupabaseClient<Database>) {
  return createAdminFeedbacksService({
    sessionDb,
    repo: createAdminFeedbacksRepository(sessionDb),
    notifyMentor: sendMentorNewReviewNotification,
    // O tipo de ação ainda não tem nome próprio (audit-logger é compartilhado).
    audit: (adminId, details, mentorId) =>
      logAdminAction(adminId, "bulk_action", details, mentorId)
  })
}
