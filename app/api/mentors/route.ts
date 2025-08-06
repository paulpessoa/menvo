import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { MentorProfile } from '@/services/mentors/mentors';

export async function GET(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const search = searchParams.get('search') || '';
  const topics = searchParams.getAll('topics');
  const languages = searchParams.getAll('languages');
  const experienceYears = searchParams.getAll('experienceYears').map(Number);
  const educationLevels = searchParams.getAll('educationLevels');
  const rating = searchParams.get('rating') ? Number(searchParams.get('rating')) : undefined;
  const city = searchParams.get('city') || '';
  const country = searchParams.get('country') || '';
  const state_province = searchParams.get('state_province') || '';
  const inclusionTags = searchParams.getAll('inclusionTags');
  const page = Number(searchParams.get('page') || 1);
  const limit = Number(searchParams.get('limit') || 12);
  const sortBy = searchParams.get('sortBy') || 'name-asc';

  let query = supabase
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
        created_at
      ),
      mentor_skills (skill_name)
    `, { count: 'exact' });

  // Apply filters
  if (search) {
    query = query.or(`current_position.ilike.%${search}%,current_company.ilike.%${search}%,bio.ilike.%${search}%`);
    // Also search in user_profiles and mentor_skills
    query = query.filter('user_profiles.full_name', 'ilike', `%${search}%`);
    query = query.filter('mentor_skills.skill_name', 'ilike', `%${search}%`);
  }

  if (topics.length > 0) {
    query = query.contains('mentor_skills.skill_name', topics);
  }

  if (languages.length > 0) {
    query = query.contains('user_profiles.languages', languages);
  }

  if (experienceYears.length > 0) {
    // Assuming experienceYears are min values, e.g., [1, 5, 10]
    // This logic might need refinement based on how experienceYears are stored/filtered
    query = query.gte('user_profiles.years_experience', Math.min(...experienceYears));
  }

  if (educationLevels.length > 0) {
    query = query.in('user_profiles.education_level', educationLevels);
  }

  if (rating !== undefined) {
    query = query.gte('rating', rating);
  }

  if (city) {
    query = query.ilike('user_profiles.location', `%${city}%`);
  }
  if (country) {
    query = query.ilike('user_profiles.location', `%${country}%`);
  }
  if (state_province) {
    query = query.ilike('user_profiles.location', `%${state_province}%`);
  }

  if (inclusionTags.length > 0) {
    // This assumes a column for inclusion tags, adjust as needed
    // query = query.contains('inclusion_tags_column', inclusionTags);
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit - 1;
  query = query.range(startIndex, endIndex);

  // Sorting
  switch (sortBy) {
    case 'name-asc':
      query = query.order('user_profiles.full_name', { ascending: true });
      break;
    case 'name-desc':
      query = query.order('user_profiles.full_name', { ascending: false });
      break;
    case 'experience-asc':
      query = query.order('user_profiles.years_experience', { ascending: true });
      break;
    case 'experience-desc':
      query = query.order('user_profiles.years_experience', { ascending: false });
      break;
    case 'rating-asc':
      query = query.order('rating', { ascending: true });
      break;
    case 'rating-desc':
      query = query.order('rating', { ascending: false });
      break;
    default:
      query = query.order('user_profiles.full_name', { ascending: true });
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching mentors:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const formattedMentors: MentorProfile[] = (data || []).map(mentor => ({
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
    created_at: mentor.user_profiles?.created_at || '',
  }));

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return NextResponse.json({
    mentors: formattedMentors,
    totalCount,
    currentPage: page,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  });
}
