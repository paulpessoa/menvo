import { createClient } from "@/utils/supabase/server"

/**
 * Check if a user is a volunteer based on their role or a specific volunteer flag
 * This function can be used server-side
 */
export async function isUserVolunteer(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient()

    // First check if user has a volunteer flag in their profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_volunteer, user_role")
      .eq("id", userId)
      .single()

    if (profileError) {
      console.error("Error checking profile:", profileError)
      return false
    }

    // Check if user has volunteer flag set to true
    if (profile?.is_volunteer === true) {
      return true
    }

    // Check if user has admin, mentor, or volunteer role
    const volunteerRoles = ["admin", "mentor", "volunteer"]
    if (profile?.user_role && volunteerRoles.includes(profile.user_role)) {
      return true
    }

    return false
  } catch (error) {
    console.error("Error in isUserVolunteer:", error)
    return false
  }
}

