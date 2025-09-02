"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  slug: string | null
  bio: string | null
  avatar_url: string | null
  current_position: string | null
  current_company: string | null
  linkedin_url: string | null
  portfolio_url: string | null
  personal_website_url: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  expertise_areas: string[] | null
  topics: string[] | null
  inclusion_tags: string[] | null
  languages: string[] | null
  mentorship_approach: string | null
  what_to_expect: string | null
  ideal_mentee: string | null
  cv_url: string | null
  role: string | null
  status: string | null
  verification_status: string | null
  created_at: string
  updated_at: string
}

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchProfile()
    } else {
      setProfile(null)
      setLoading(false)
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          // Profile doesn't exist, create it
          await createProfile()
        } else {
          throw fetchError
        }
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error("Error fetching profile:", err)
      setError(err instanceof Error ? err.message : "Error fetching profile")
    } finally {
      setLoading(false)
    }
  }

  const createProfile = async () => {
    if (!user) return

    try {
      const { data, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email || "",
          first_name: user.user_metadata?.first_name || "",
          last_name: user.user_metadata?.last_name || "",
          full_name: user.user_metadata?.full_name || "",
          role: user.user_metadata?.user_type || "mentee",
          status: "pending",
          verification_status: "pending",
        })
        .select()
        .single()

      if (createError) throw createError
      setProfile(data)
    } catch (err) {
      console.error("Error creating profile:", err)
      setError(err instanceof Error ? err.message : "Error creating profile")
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return

    try {
      setError(null)

      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single()

      if (updateError) throw updateError
      setProfile(data)
      return data
    } catch (err) {
      console.error("Error updating profile:", err)
      setError(err instanceof Error ? err.message : "Error updating profile")
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
