import { supabase } from "@/lib/services/auth/auth.service"

export interface WaitingListEntry {
  name: string
  email: string
  whatsapp?: string | null
  reason: string
  user_type: "mentor" | "mentee" | "company" | string
}

/**
 * Service to manage waiting list submissions.
 */
export const waitingListService = {
  /**
   * Adiciona um novo usuário à lista de espera.
   * @param entry - Dados do usuário para a lista de espera
   */
  join: async (entry: WaitingListEntry): Promise<void> => {
    const { error } = await (supabase.from("waiting_list") as any).insert([
      {
        name: entry.name,
        email: entry.email,
        whatsapp: entry.whatsapp || null,
        reason: entry.reason,
        user_type: entry.user_type
      }
    ])

    if (error) throw error
  }
}
