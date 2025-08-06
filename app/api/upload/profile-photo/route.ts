import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExt}`;
  const filePath = `avatars/${user.id}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('avatars') // Ensure you have a bucket named 'avatars' in Supabase Storage
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get public URL of the uploaded file
  const { data: publicUrlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    return NextResponse.json({ error: 'Could not get public URL' }, { status: 500 });
  }

  // Update user's profile with the new avatar URL
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({ avatar_url: publicUrlData.publicUrl })
    .eq('id', user.id);

  if (updateError) {
    console.error('Error updating user profile with avatar URL:', updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ publicUrl: publicUrlData.publicUrl });
}
