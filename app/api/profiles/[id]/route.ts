import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const supabase = createClient();

  try {
    const { data: profile, error } = await supabase
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
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }
      throw error;
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ data: profile }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching user profile by ID:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const updates = await request.json();

  try {
    const { skills, ...profileUpdates } = updates;

    // Update user_profiles table
    const { data: updatedProfile, error: profileError } = await supabase
      .from('user_profiles')
      .update(profileUpdates)
      .eq('id', id)
      .select()
      .single();

    if (profileError) {
      throw profileError;
    }

    // Handle skills update
    if (skills && Array.isArray(skills)) {
      // Delete existing skills for the user
      const { error: deleteError } = await supabase
        .from('skills')
        .delete()
        .eq('user_id', id);

      if (deleteError) {
        throw deleteError;
      }

      // Insert new skills
      const skillsToInsert = skills.map(skill => ({
        ...skill,
        user_id: id,
        id: undefined, // Supabase will generate UUID
        created_at: undefined, // Supabase will set timestamp
      }));

      const { error: insertError } = await supabase
        .from('skills')
        .insert(skillsToInsert);

      if (insertError) {
        throw insertError;
      }
    }

    return NextResponse.json({ data: updatedProfile, message: 'Profile updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating user profile:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
