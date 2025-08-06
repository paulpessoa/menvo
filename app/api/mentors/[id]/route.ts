import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { MentorProfile } from '@/services/mentors/mentors';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const supabase = createClient();

  const { data: mentor, error } = await supabase
    .from('mentors')
    .select(`
      *,
      user_profiles (
        full_name,
        email,
        avatar_url,
        location,
        bio,
        years_experience,
        education_level,
        languages,
        social_links,
        is_profile_complete,
        created_at
      ),
      mentor_skills (skill_name),
      mentor_availability (day_of_week, start_time, end_time)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching mentor:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!mentor) {
    return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
  }

  // Flatten the data structure for easier consumption
  const formattedMentor: MentorProfile = {
    id: mentor.id,
    user_id: mentor.user_id,
    first_name: mentor.user_profiles?.full_name?.split(' ')[0] || '',
    last_name: mentor.user_profiles?.full_name?.split(' ').slice(1).join(' ') || '',
    email: mentor.user_profiles?.email || '',
    avatar_url: mentor.user_profiles?.avatar_url || null,
    bio: mentor.user_profiles?.bio || null,
    current_position: mentor.current_position || null,
    current_company: mentor.current_company || null,
    years_experience: mentor.user_profiles?.years_experience || null,
    education_level: mentor.user_profiles?.education_level || null,
    location: mentor.user_profiles?.location || null,
    languages: mentor.user_profiles?.languages || [],
    availability: mentor.availability,
    total_sessions: mentor.total_sessions || 0,
    rating: mentor.rating || 0,
    verified_at: mentor.verified_at,
    mentor_skills: mentor.mentor_skills.map((s: { skill_name: string }) => s.skill_name),
    social: mentor.user_profiles?.social_links || {},
    created_at: mentor.user_profiles?.created_at || '',
  };

  return NextResponse.json(formattedMentor);
}
