import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { user_profile } from '@/types/database';

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      user_roles (role),
      user_skills (skill_name, skill_category, proficiency_level, is_mentor_skill, is_learning_skill),
      companies (company_name, description, company_size, industry, website, verified)
    `)
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // Flatten the data structure for easier consumption
  const formattedProfile = {
    ...profile,
    roles: profile.user_roles.map((r: { role: string }) => r.role),
    skills: profile.user_skills,
    company_profile: profile.companies, // Assuming 'companies' is the relationship name
  };

  // Remove nested objects if they are not needed directly
  delete formattedProfile.user_roles;
  delete formattedProfile.user_skills;
  delete formattedProfile.companies;

  return NextResponse.json(formattedProfile);
}
