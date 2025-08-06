import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const supabase = createClient();

  try {
    const { data: mentor, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        skills (
          id,
          skill_name,
          skill_category,
          proficiency_level,
          is_mentor_skill,
          is_learning_skill,
          created_at
        )
      `)
      .eq('id', id)
      .eq('role', 'mentor') // Ensure it's a mentor profile
      .not('verified_at', 'is', null) // Only fetch verified mentors
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        return NextResponse.json({ error: 'Mentor not found or not verified' }, { status: 404 });
      }
      throw error;
    }

    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found or not verified' }, { status: 404 });
    }

    return NextResponse.json({ data: mentor }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching mentor profile by ID:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
