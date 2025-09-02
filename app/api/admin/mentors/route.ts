import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/services/auth/supabase'
import { getUserFromRequest } from '@/lib/auth/server-utils'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || !user.role || !['admin', 'moderator'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      user_id,
      title,
      company,
      experience_years,
      expertise_areas,
      topics,
      inclusion_tags,
      linkedin_url,
      portfolio_url,
      academic_background,
      current_work,
      areas_of_interest,
      session_duration,
      timezone,
      status = 'pending_verification'
    } = body

    if (!user_id || !title || !experience_years || !expertise_areas || !topics) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('mentors')
      .insert([{
        user_id,
        title,
        company,
        experience_years,
        expertise_areas,
        topics,
        inclusion_tags,
        linkedin_url,
        portfolio_url,
        academic_background,
        current_work,
        areas_of_interest,
        session_duration,
        timezone,
        status
      }])

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, mentor: data?.[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
