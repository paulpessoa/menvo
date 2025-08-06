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
  const fileName = `${user.id}-${uuidv4()}.${fileExt}`; // Use UUID to prevent caching issues and ensure uniqueness
  const filePath = `avatars/${fileName}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from('avatars') // Ensure you have a bucket named 'avatars' in Supabase Storage
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Set to false to prevent overwriting existing files with the same name
      });

    if (uploadError) {
      // If the file already exists (e.g., same UUID generated, or user re-uploads same file name)
      // You might want to handle this by trying to update or delete the old one first.
      // For now, we'll just throw the error.
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update the user's profile with the new avatar_url
    const { error: updateProfileError } = await supabase
      .from('user_profiles')
      .update({ avatar_url: publicUrlData.publicUrl })
      .eq('id', user.id);

    if (updateProfileError) {
      // If profile update fails, consider deleting the uploaded file to clean up storage
      await supabase.storage.from('avatars').remove([filePath]);
      throw updateProfileError;
    }

    return NextResponse.json({ publicUrl: publicUrlData.publicUrl }, { status: 200 });
  } catch (error: any) {
    console.error('Error uploading profile photo:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload photo' }, { status: 500 });
  }
}
