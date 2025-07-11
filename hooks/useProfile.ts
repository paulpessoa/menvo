"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useAuth } from "./useAuth"

interface Profile {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  slug: string
  bio: string
  current_position: string
  current_company: string
  linkedin_url: string
  portfolio_url: string
  personal_website_url: string
  address: string
  city: string
  state: string
  country: string
  latitude: number | null
  longitude: number | null
  avatar_url: string
  role: string
  status: string
  verification_status: string
  // Mentor specific fields
  expertise_areas: string[]
  topics: string[]
  inclusion_tags: string[]
  languages: string[]
  mentorship_approach: string
  what_to_expect: string
  ideal_mentee: string
  cv_url: string
  created_at: string
  updated_at: string
}

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    fetchProfile()
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Fetch profile with mentor data if exists
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(
          `
          *,
          mentor_profiles (
            expertise_areas,
            topics,
            inclusion_tags,
            languages,
            mentorship_approach,
            what_to_expect,
            ideal_mentee,
            cv_url
          )
        `,
        )
        .eq("id", user.id)
        .single()

      if (profileError) {
        throw profileError
      }

      // Merge mentor data if exists
      const mentorData = profileData.mentor_profiles?.[0] || {}
      const mergedProfile = {
        ...profileData,
        ...mentorData,
        mentor_profiles: undefined, // Remove the nested object
      }

      setProfile(mergedProfile)
    } catch (err) {
      console.error("Error fetching profile:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch profile")
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error("No user logged in")

    try {
      setError(null)

      // Separate profile updates from mentor updates
      const {
        expertise_areas,
        topics,
        inclusion_tags,
        languages,
        mentorship_approach,
        what_to_expect,
        ideal_mentee,
        cv_url,
        ...profileUpdates
      } = updates

      // Update main profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          ...profileUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (profileError) throw profileError

      // Update mentor profile if mentor-specific fields are provided
      const mentorUpdates = {
        expertise_areas,
        topics,
        inclusion_tags,
        languages,
        mentorship_approach,
        what_to_expect,
        ideal_mentee,
        cv_url,
      }

      const hasMentorUpdates = Object.values(mentorUpdates).some((value) => value !== undefined)

      if (hasMentorUpdates) {
        const { error: mentorError } = await supabase.from("mentor_profiles").upsert({
          user_id: user.id,
          ...Object.fromEntries(Object.entries(mentorUpdates).filter(([_, value]) => value !== undefined)),
          updated_at: new Date().toISOString(),
        })

        if (mentorError) throw mentorError
      }

      // Refresh profile data
      await fetchProfile()
    } catch (err) {
      console.error("Error updating profile:", err)
      throw err
    }
  }

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: fetchProfile,
  }
}
