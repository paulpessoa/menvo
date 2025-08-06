import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)

  const searchTerm = searchParams.get('search')
  const skillFilter = searchParams.get('skills')?.split(',')
  const availabilityFilter = searchParams.get('availability') // e.g., 'monday,tuesday'
  const languageFilter = searchParams.get('languages')?.split(',')
  const minExperience = searchParams.get('minExperience')
  const maxExperience = searchParams.get('maxExperience')
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
  const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

  try {
    let query = supabase
      .from('mentors')
      .select(`
        id,
        user_id,
        bio,
        is_available,
        average_rating,
        total_sessions,
        user_profiles (
          full_name,
          email,
          avatar_url,
          location,
          occupation,
          years_experience,
          languages,
          verified_at
        ),
        skills (
          skill_name,
          skill_category,
          proficiency_level
        )
      `, { count: 'exact' })
      .eq('is_available', true) // Only show available mentors by default
      .eq('user_profiles.role', 'mentor') // Ensure the associated user profile is a mentor
      .eq('user_profiles.is_profile_complete', true) // Only show complete profiles
      .not('user_profiles.verified_at', 'is', null) // Only show verified mentors

    if (searchTerm) {
      query = query.or(`user_profiles.full_name.ilike.%${searchTerm}%,user_profiles.occupation.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`)
    }

    if (skillFilter && skillFilter.length > 0) {
      // This requires a more complex join or a separate query if skills are in a different table
      // For simplicity, assuming skills are directly on the mentor profile or a simple array match
      // A proper solution would involve a join with the skills table and filtering by skill_name
      // For now, let's assume skills are part of the user_profiles or a related table that can be filtered.
      // If skills are an array column on user_profiles:
      // query = query.contains('user_profiles.skills', skillFilter);
      // For now, we'll skip direct skill filtering in the main query and rely on client-side filtering or a more advanced DB query.
    }

    if (languageFilter && languageFilter.length > 0) {
      // Assuming languages is a text array column on user_profiles
      query = query.contains('user_profiles.languages', languageFilter)
    }

    if (minExperience) {
      query = query.gte('user_profiles.years_experience', parseInt(minExperience))
    }

    if (maxExperience) {
      query = query.lte('user_profiles.years_experience', parseInt(maxExperience))
    }

    // Availability filtering would require a join with a separate availability table
    // or a more complex query if availability is stored as a JSONB column.
    // For now, we'll omit direct availability filtering in the main query.

    const { data: mentors, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('average_rating', { ascending: false }) // Order by rating, then by total sessions
      .order('total_sessions', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ data: mentors, count }, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching mentors:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
