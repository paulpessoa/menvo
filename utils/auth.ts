import { supabase } from '@/services/auth/supabase'
import { jwtDecode } from 'jwt-decode'

interface DecodedToken {
  role?: string
  [key: string]: any
}

export async function getUserFromRequest(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    const token = authHeader.substring(7)
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) {
      return null
    }
    let role: string | undefined = undefined
    try {
      const decoded: DecodedToken = jwtDecode(token)
      role = decoded.role
    } catch {
      // ignore decode errors
    }
    return {
      ...data.user,
      role
    }
  } catch {
    return null
  }
}