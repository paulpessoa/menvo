import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Redirect to dashboard or a welcome page after successful login/signup
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/login?message=Could not authenticate user`)
}
