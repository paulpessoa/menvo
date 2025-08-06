import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const supabase = createClient()

  try {
    const { data: mentor, error } = await supabase
      .from('mentors')
      .select(`
        *,
        user_profiles (
          full_name,
          email,
          avatar_url,
          bio,
          location,
          occupation,
          years_experience,
          education_level,
          languages,
          social_links,
          is_profile_complete,
          verified_at
        ),
        skills (
          skill_name,
          skill_category,
          proficiency_level
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        return NextResponse.json({ error: 'Mentor not found' }, { status: 404 })
      }
      throw error
    }

    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 })
    }

    return NextResponse.json({ data: mentor }, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching mentor by ID:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
