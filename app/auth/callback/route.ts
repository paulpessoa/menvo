import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Redirect to dashboard or a specific post-auth page
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
    }
  }

  // return the user to an error page with some instructions
  return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_callback_failed`)
}
