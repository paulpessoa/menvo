import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const origin = headers().get('origin')
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'linkedin',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?message=Could not authenticate user`,
      { status: 301 }
    )
  }

  return NextResponse.redirect(data.url, { status: 301 })
}
