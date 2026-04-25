import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"
import type { Database } from "@/lib/types/supabase"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { name, email, whatsapp, reason } = body

    if (!email) {
      return errorResponse("Email is required", "VALIDATION_ERROR", 400)
    }

    const { data, error } = await supabase
      .from("waiting_list")
      .insert({
        name: name || "Usuário",
        email: email.toLowerCase().trim(),
        whatsapp: whatsapp || null,
        reason: reason || null,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return errorResponse("Email already registered", "CONFLICT", 409)
      }
      throw error
    }

    return successResponse(data, "Joined waiting list successfully")
  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar se é admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401)

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id)
      .returns<any>()
      .maybeSingle()

    if ((roleData as any)?.roles?.name !== 'admin') {
      return errorResponse("Forbidden", "FORBIDDEN", 403)
    }

    const { data, error } = await supabase
      .from("waiting_list")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<any[]>()

    if (error) throw error

    return successResponse(data)
  } catch (error) {
    return handleApiError(error)
  }
}
