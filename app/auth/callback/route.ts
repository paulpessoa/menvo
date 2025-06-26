// import { createClient } from '@/utils/supabase/client'
// import { NextResponse } from 'next/server'
// // The client you created from the Server-Side Auth instructions

// export async function GET(request: Request) {
//   const { searchParams, origin } = new URL(request.url)
//   const code = searchParams.get('code')
//   // if "next" is in param, use it as the redirect URL
//   let next = searchParams.get('next') ?? '/'
//   if (!next.startsWith('/')) {
//     // if "next" is not a relative URL, use the default
//     next = '/'
//   }

//   if (code) {
//     const supabase = await createClient()
//     const { error } = await supabase.auth.exchangeCodeForSession(code)
//     if (!error) {
//       const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
//       const isLocalEnv = process.env.NODE_ENV === 'development'
//       if (isLocalEnv) {
//         // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
//         return NextResponse.redirect(`${origin}${next}`)
//       } else if (forwardedHost) {
//         return NextResponse.redirect(`https://${forwardedHost}${next}`)
//       } else {
//         return NextResponse.redirect(`${origin}${next}`)
//       }
//     }
//   }

//   // return the user to an error page with instructions
//   return NextResponse.redirect(`${origin}/auth/auth-code-error`)
// }




import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)

    // NOVO: atribuir role default "mentee" se não houver
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (!roles || roles.length === 0) {
        await supabase.from('user_roles').insert({
          user_id: user.id,
          role_type: 'mentee',
          is_primary: true,
          status: 'active'
        })
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/', requestUrl.origin))
} 