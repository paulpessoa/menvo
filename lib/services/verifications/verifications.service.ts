import { createClient } from "@/lib/utils/supabase/client"
import type { Database } from "@/lib/types/supabase"

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]

class VerificationServiceClass {
  private supabase = createClient()

  // getPendingVerifications used to live here, querying `profiles` straight
  // from the browser (docs/COMMUNITY_CONTACT_PLAN.md §13). Its only caller
  // (/dashboard/admin/verifications) now calls GET /api/admin/verifications/pending.

  /**
   * @deprecated Use POST /api/admin/verify instead. This ran the profile
   * update AND (previously) would need to assign the "mentor" RBAC role
   * client-side with the caller's own anon-key session - cross-user writes
   * to user_roles have no confirmed RLS policy for that, unlike the admin
   * policy that already covers `profiles`. The API route does this
   * server-side with a service-role client, which is guaranteed to work
   * regardless of RLS and matches how every other cross-user admin
   * mutation in this codebase is done. Kept only so this class still
   * compiles for any other lingering references; not called by the
   * verifications page anymore.
   */
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

    const { error } = await (this.supabase
      .from("profiles") as any)
      .update(updatePayload)
      .eq("id", verificationId)

    if (error) throw error
    return true
  }

  /**
   * Directly sets or removes mentor verification status with correct typing.
   */
  async setMentorVerification(mentorId: string, verified: boolean): Promise<boolean> {
    const updatePayload: ProfileUpdate = {
      verified,
      verification_status: verified ? "approved" : "rejected",
      verified_at: verified ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    }

    const { error } = await (this.supabase
      .from("profiles") as any)
      .update(updatePayload)
      .eq("id", mentorId)

    if (error) throw error
    return true
  }
}

export const VerificationService = new VerificationServiceClass()
