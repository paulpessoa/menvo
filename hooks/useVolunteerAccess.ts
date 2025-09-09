"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/utils/supabase/client"
import { useAuth } from "@/lib/auth"

/**
 * Client-side function to check if current user is a volunteer
 */
async function checkIsVolunteer(): Promise<boolean> {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return false
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_volunteer, user_role")
      .eq("id", user.id)
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
    console.error("Error in checkIsVolunteer:", error)
    return false
  }
}

/**
 * Client-side hook to check if current user is a volunteer
 */
export function useIsVolunteer() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ["is-volunteer", user?.id],
    queryFn: checkIsVolunteer,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}
