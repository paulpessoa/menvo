/**
 * Camada 7 · Composição do service de appointments
 * Regra: o único lugar que escolhe os clients do banco e os adapters reais
 * (Brevo, Google Calendar) e os entrega ao service. As rotas só chamam
 * `buildAppointmentsService(client da sessão)`.
 * Não faz: regra de negócio (é do service).
 * Dois clients, por decisão do ADR 0008:
 * - `repo`/`feedbacks`: a SESSÃO do usuário. A RLS de UPDATE do participante e o
 *   trigger `appointments_guard_update` valem. É o que concluir, avaliar e a escrita
 *   do cancelar usam (§4 do ADR).
 * - `admin()`: `service_role`, criado na primeira chamada, nunca no import (o build
 *   roda sem segredos). Fica para as exceções E3 (contato da outra parte), E5 (token
 *   do e-mail), as leituras de lista com embed de `profiles` e o que ainda não tem
 *   policy (apagar avaliação no no-show, editar a própria avaliação). A permissão de
 *   cada caso de uso é conferida no service, porque o banco não sabe qual usuário
 *   está atrás de uma chamada `service_role`.
 * - `buildPublicAvailabilityDeps()`: exceção E6. O visitante anônimo precisa ver quais
 *   horários estão ocupados, e `appointments` não tem leitura para `anon`. O client
 *   privilegiado só sai daqui e só lê horário/duração (`listBusyIntervals`) e a agenda
 *   semanal. Sai quando existir a RPC `mentor_busy_slots` (onda futura).
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { createAppointmentsRepository } from "@/lib/repositories/appointments.repository"
import { createAppointmentFeedbacksRepository } from "@/lib/repositories/appointment-feedbacks.repository"
import { createMentorAvailabilityRepository } from "@/lib/repositories/mentor-availability.repository"
import { createAppointmentMentorRepository } from "@/lib/repositories/appointment-mentor.repository"
import { brevoAppointmentMailer } from "@/lib/ports/adapters/appointment-mailer.brevo"
import { googleAppointmentCalendar } from "@/lib/ports/adapters/appointment-calendar.google"
import { createAppointmentsService } from "./appointments.service"
import type { AvailabilityDeps } from "./availability.service"
import { findPendingMenteeCheckin } from "./checkin-responses.service"

export function buildAppointmentsService(session: SupabaseClient<Database>) {
  let admin: SupabaseClient<Database> | null = null
  const getAdmin = () => (admin ??= createServiceRoleClient() as SupabaseClient<Database>)

  return createAppointmentsService({
    repo: createAppointmentsRepository(session),
    feedbacks: createAppointmentFeedbacksRepository(session),
    admin: () => ({
      repo: createAppointmentsRepository(getAdmin()),
      feedbacks: createAppointmentFeedbacksRepository(getAdmin()),
    }),
    // Pedido novo (`requestAppointment`) roda inteiro na sessão do mentorado.
    mentors: createAppointmentMentorRepository(session),
    pendingCheckin: (menteeId) => findPendingMenteeCheckin(session, menteeId),
    mailer: brevoAppointmentMailer,
    calendar: googleAppointmentCalendar,
  })
}

/**
 * Leituras da disponibilidade com o client da SESSÃO (RLS vale). É o que a tool do
 * assistente usa: a visão dela segue a de quem chamou.
 */
export function buildAvailabilityDeps(session: SupabaseClient<Database>): AvailabilityDeps {
  return {
    availability: createMentorAvailabilityRepository(session),
    appointments: createAppointmentsRepository(session),
  }
}

/**
 * Leituras da disponibilidade para a rota pública (E6, ADR 0008): `service_role`
 * criado só quando a rota é chamada, nunca no import. Só entrega duas leituras, sem
 * escrita nem dados de pessoas.
 */
export function buildPublicAvailabilityDeps(): AvailabilityDeps {
  const admin = createServiceRoleClient() as SupabaseClient<Database>
  return {
    availability: createMentorAvailabilityRepository(admin),
    appointments: createAppointmentsRepository(admin),
  }
}
