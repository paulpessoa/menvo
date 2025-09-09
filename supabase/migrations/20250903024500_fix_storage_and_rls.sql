-- Fix storage bucket and RLS policies for profile updates

-- 1. Create profile-photos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Add storage policies for profile-photos bucket
CREATE POLICY "users_can_upload_own_profile_photo" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "users_can_update_own_profile_photo" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'profile-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "users_can_delete_own_profile_photo" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'profile-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "public_can_view_profile_photos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'profile-photos');

-- 3. Fix RLS policy for profile updates to be more permissive
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles;

CREATE POLICY "users_can_update_own_profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Add policy for profile inserts (in case needed)
CREATE POLICY "users_can_insert_own_profile" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 5. Ensure service role can bypass RLS for profile creation
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
