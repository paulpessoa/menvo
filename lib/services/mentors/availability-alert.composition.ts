import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createMentorAvailabilityAlertRepository } from "@/lib/repositories/mentor-availability-alert.repository"
import { createAvailabilityAlertService } from "./availability-alert.service"
import { sendMentorAvailabilityAlertEmail } from "@/lib/email/brevo"

export function buildAvailabilityAlertService(supabase: SupabaseClient<Database>) {
  const repo = createMentorAvailabilityAlertRepository(supabase)

  return createAvailabilityAlertService({
    repo,
    sendEmail: sendMentorAvailabilityAlertEmail,
    getMentorInfo: async (mentorId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, slug, avatar_url, job_title, company")
        .eq("id", mentorId)
        .maybeSingle()
      return data
    },
  })
}
