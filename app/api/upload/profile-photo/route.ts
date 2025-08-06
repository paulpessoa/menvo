import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}-${uuidv4()}.${fileExt}` // Use UUID to prevent caching issues and ensure uniqueness
  const filePath = `avatars/${fileName}`

  try {
    const { data, error: uploadError } = await supabase.storage
      .from('avatars') // Ensure you have a bucket named 'avatars' in Supabase Storage
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Do not upsert, create new file
        contentType: file.type,
      })

    if (uploadError) {
      throw uploadError
    }

    // Get public URL of the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('Could not get public URL for the uploaded file.')
    }

    // Update user_profiles table with the new avatar_url
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ avatar_url: publicUrlData.publicUrl })
      .eq('id', user.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ publicUrl: publicUrlData.publicUrl }, { status: 200 })
  } catch (error: any) {
    console.error('Error uploading profile photo:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
