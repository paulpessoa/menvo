/**
 * Camada 7 · Composição do pedido para ser mentor
 * Regra: escolhe o repository e o mailer reais. Recebe o client DA SESSÃO e
 * nunca cria `service_role`: a RPC `request_mentor_verification` e o `UPDATE`
 * de `mentor_profiles` já são cobertos pelas grants e pelo RLS.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createMentorRequestRepository } from "@/lib/repositories/mentor-request.repository"
import { brevoProfileMailer } from "@/lib/ports/adapters/profile-mailer.brevo"
import { createMentorRequestService } from "./mentor-request.service"

export function buildMentorRequestService(supabase: SupabaseClient<Database>) {
  return createMentorRequestService({
    repo: createMentorRequestRepository(supabase),
    mailer: brevoProfileMailer,
  })
}
