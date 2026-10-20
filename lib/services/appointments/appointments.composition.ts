/**
 * Camada 7 · Composição do service de appointments
 * Regra: o único lugar que escolhe o client do banco e os adapters reais (Brevo)
 * e os entrega ao service. As rotas só chamam `buildAppointmentsService`.
 * Não faz: regra de negócio (é do service).
 * Tradeoff TEMPORÁRIO: o client é `service_role`, como as rotas migradas já
 * eram (elas liam o agendamento de outra pessoa e o e-mail dela, que a RLS de
 * `profiles` esconde). Está isolado aqui, sem nenhum uso novo, até o ADR 0008
 * (docs/blueprint/appointments-audit.md, D1) decidir o que fica e o que vai
 * para o client da sessão. A permissão de cada caso de uso é conferida no
 * service, porque o banco não sabe qual usuário está atrás de uma rota
 * `service_role`.
 * O client nasce na chamada, nunca no import: `next build` importa as rotas sem
 * as chaves.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { createAppointmentsRepository } from "@/lib/repositories/appointments.repository"
import { createAppointmentFeedbacksRepository } from "@/lib/repositories/appointment-feedbacks.repository"
import { brevoAppointmentMailer } from "@/lib/ports/adapters/appointment-mailer.brevo"
import { googleAppointmentCalendar } from "@/lib/ports/adapters/appointment-calendar.google"
import { createAppointmentsService } from "./appointments.service"

export function buildAppointmentsService() {
  const db = createServiceRoleClient() as SupabaseClient<Database>
  return createAppointmentsService({
    repo: createAppointmentsRepository(db),
    feedbacks: createAppointmentFeedbacksRepository(db),
    mailer: brevoAppointmentMailer,
    calendar: googleAppointmentCalendar,
  })
}
