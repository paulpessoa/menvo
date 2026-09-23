import type { Profile } from "@/hooks/useProfile"
import { getBrowserTimezone } from "@/lib/utils/timezone"

/** Editable subset of `profiles` shown on /profile. Every key is a real DB column. */
export interface ProfileFormData {
  first_name: string
  last_name: string
  slug: string
  bio: string
  avatar_url: string
  is_public: boolean
  city: string
  state: string
  country: string
  timezone: string
  job_title: string
  company: string
  linkedin_url: string
  portfolio_url: string
  institution: string
  course: string
  academic_level: string
  expected_graduation: string
  expertise_areas: string[]
  mentorship_topics: string[]
  learning_goals: string
  cv_url: string
  mentorship_approach: string
  what_to_expect: string
}

/** Patch-style setter shared by every profile section. */
export type ProfileFormPatch = (patch: Partial<ProfileFormData>) => void

/**
 * Maps a DB profile into form state. Nulls become empty strings so inputs stay
 * controlled; a missing/UTC timezone falls back to the browser's zone because
 * UTC is the DB default, not a choice the person made.
 */
export function profileToForm(profile: Profile): ProfileFormData {
  return {
    first_name: profile.first_name ?? "",
    last_name: profile.last_name ?? "",
    slug: profile.slug ?? "",
    bio: profile.bio ?? "",
    avatar_url: profile.avatar_url ?? "",
    is_public: profile.is_public ?? false,
    city: profile.city ?? "",
    state: profile.state ?? "",
    country: profile.country ?? "",
    timezone: profile.timezone && profile.timezone !== "UTC" ? profile.timezone : getBrowserTimezone(),
    job_title: profile.job_title ?? "",
    company: profile.company ?? "",
    linkedin_url: profile.linkedin_url ?? "",
    portfolio_url: profile.portfolio_url ?? "",
    institution: profile.institution ?? "",
    course: profile.course ?? "",
    academic_level: profile.academic_level ?? "",
    expected_graduation: profile.expected_graduation ?? "",
    expertise_areas: profile.expertise_areas ?? [],
    mentorship_topics: profile.mentorship_topics ?? [],
    learning_goals: profile.learning_goals ?? "",
    cv_url: profile.cv_url ?? "",
    mentorship_approach: profile.mentorship_approach ?? "",
    what_to_expect: profile.what_to_expect ?? "",
  }
}
