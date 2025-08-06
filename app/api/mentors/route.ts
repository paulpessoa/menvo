import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();

  const { searchParams } = new URL(request.url);
  const skill = searchParams.get('skill');
  const location = searchParams.get('location');
  const language = searchParams.get('language');
  const minExperience = searchParams.get('minExperience');
  const maxExperience = searchParams.get('maxExperience');
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');

  let query = supabase
    .from('user_profiles')
    .select(`
      id,
      full_name,
      avatar_url,
      current_position,
      current_company,
      location,
      years_experience,
      bio,
      skills (
        skill_name,
        skill_category,
        proficiency_level,
        is_mentor_skill
      )
    `)
    .eq('role', 'mentor')
    .not('verified_at', 'is', null); // Only fetch verified mentors

  if (skill) {
    query = query.ilike('skills.skill_name', `%${skill}%`);
  }
  if (location) {
    query = query.ilike('location', `%${location}%`);
  }
  if (language) {
    query = query.contains('languages', [language]);
  }
  if (minExperience) {
    query = query.gte('years_experience', parseInt(minExperience));
  }
  if (maxExperience) {
    query = query.lte('years_experience', parseInt(maxExperience));
  }

  if (limit) {
    query = query.limit(parseInt(limit));
  }
  if (offset) {
    query = query.range(parseInt(offset), parseInt(offset) + (parseInt(limit) || 9) - 1);
  }

  const { data: mentors, error } = await query;

  if (error) {
    console.error('Error fetching mentors:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: mentors });
}
