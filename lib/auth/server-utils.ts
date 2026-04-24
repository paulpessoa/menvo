import { createClient } from "@supabase/supabase-js"
import { NextRequest } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function getUserFromRequest(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    
    // Use service role client for server-side operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) {
      return null
    }

    // Get user profile and role
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles (
          roles (
            name
          )
        )
      `)
      .eq('id', data.user.id)
      .single()

    const role = profile?.user_roles?.roles?.name || null

    return {
      ...data.user,
      role,
      profile
    }
  } catch {
    return null
  }
}
