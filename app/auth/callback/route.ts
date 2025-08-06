import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard' // Default redirect

  if (code) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // After successful login/signup, check if profile is complete
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error getting user after callback:', userError);
        return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`);
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_profile_complete')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found (new user)
        console.error('Error fetching user profile after callback:', profileError);
        return NextResponse.redirect(`${requestUrl.origin}/login?error=profile_fetch_failed`);
      }

      if (!profile || !profile.is_profile_complete) {
        // Redirect to welcome/onboarding if profile is not complete
        return NextResponse.redirect(`${requestUrl.origin}/welcome`);
      }

      return NextResponse.redirect(`${requestUrl.origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`);
}
