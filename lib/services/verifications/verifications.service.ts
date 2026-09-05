import { createClient } from "@/lib/utils/supabase/client"
import type { Database } from "@/lib/types/supabase"
import type { Verification } from "@/lib/types/models/verification"

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]

class VerificationServiceClass {
  private supabase = createClient()

  async getPendingVerifications(_adminId?: string): Promise<Verification[]> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("verification_status", "pending")
      .returns<ProfileRow[]>()

    if (error) throw error

    return (data || []).map((profile) => ({
      id: profile.id,
      mentor_id: profile.id,
      mentor_name:
        profile.full_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Mentor",
      mentor_email: profile.email || "",
      mentor_title: profile.job_title || "Mentor",
      mentor_company: profile.company || "",
      verification_type: "Identity",
      status: "pending",
      created_at: profile.created_at || new Date().toISOString(),
      updated_at: profile.updated_at || new Date().toISOString()
    }))
  }

  async completeVerification({
    verificationId,
    passed,
    notes
  }: {
    verificationId: string
    adminId?: string
    passed: boolean
    notes: string
  }): Promise<boolean> {
    const updatePayload: ProfileUpdate = {
      verification_status: passed ? "approved" : "rejected",
      verification_notes: notes,
      verified: passed,
      verified_at: passed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    }

    const { error } = await this.supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", verificationId)

    if (error) throw error
    return true
  }
}

export const VerificationService = new VerificationServiceClass()
