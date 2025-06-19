
import type { Database } from "@/types/database"
import { supabase } from "../auth"

type VerificationRecord = Database["public"]["Tables"]["mentor_verification"]["Row"]
type MentorRecord = Database["public"]["Tables"]["mentors"]["Row"]

export interface PendingVerification {
  verification_id: string
  mentor_id: string
  mentor_name: string
  mentor_email: string
  mentor_title: string
  mentor_company: string | null
  verification_type: string
  status: string
  created_at: string
  scheduled_at: string | null
}

export class VerificationService {
  // Solicitar verificação (mentor)
  static async requestVerification() {
    const { data, error } = await supabase.rpc("request_mentor_verification", {
      mentor_user_id: (await supabase.auth.getUser()).data.user?.id,
    })

    if (error) throw error
    return data
  }

  // Agendar verificação (admin)
  static async scheduleVerification(verificationId: string, scheduledAt: string, adminId: string) {
    const { data, error } = await supabase.rpc("schedule_mentor_verification", {
      verification_id: verificationId,
      scheduled_datetime: scheduledAt,
      admin_id: adminId,
    })

    if (error) throw error
    return data
  }

  // Completar verificação (admin)
  static async completeVerification(params: {
    verificationId: string
    adminId: string
    passed: boolean
    notes?: string
    documentsOk?: boolean
    identityOk?: boolean
    expertiseOk?: boolean
    backgroundOk?: boolean
  }) {
    const { data, error } = await supabase.rpc("complete_mentor_verification", {
      verification_id: params.verificationId,
      admin_id: params.adminId,
      verification_passed: params.passed,
      verification_notes: params.notes || null,
      documents_ok: params.documentsOk ?? true,
      identity_ok: params.identityOk ?? true,
      expertise_ok: params.expertiseOk ?? true,
      background_ok: params.backgroundOk ?? true,
    })

    if (error) throw error
    return data
  }

  // Obter verificações pendentes (admin)
  static async getPendingVerifications(adminId: string): Promise<PendingVerification[]> {
    const { data, error } = await supabase.rpc("get_pending_verifications", {
      admin_id: adminId,
    })

    if (error) throw error
    return data || []
  }

  // Obter detalhes da verificação
  static async getVerificationDetails(verificationId: string) {
    const { data, error } = await supabase
      .from("mentor_verification")
      .select(`
        *,
        mentors (
          *,
          profiles (*)
        )
      `)
      .eq("id", verificationId)
      .single()

    if (error) throw error
    return data
  }

  // Obter histórico de verificações de um mentor
  static async getMentorVerificationHistory(mentorId: string) {
    const { data, error } = await supabase
      .from("mentor_verification")
      .select("*")
      .eq("mentor_id", mentorId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  }

  // Atualizar status do mentor (admin)
  static async updateMentorStatus(
    mentorId: string,
    status: Database["public"]["Tables"]["mentors"]["Row"]["status"],
    adminId: string,
    reason?: string,
  ) {
    const { error } = await supabase.from("mentors").update({ status }).eq("id", mentorId)

    if (error) throw error

    // Log da ação admin
    await supabase.from("admin_actions").insert({
      admin_id: adminId,
      action_type: "mentor_status_updated",
      target_type: "mentor",
      target_id: mentorId,
      details: { new_status: status },
      reason,
    })
  }
}
