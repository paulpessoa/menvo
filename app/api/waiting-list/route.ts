import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"
import type { Database } from "@/lib/types/supabase"
import { requireAdmin } from "@/lib/auth/require-admin"

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
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("waiting_list")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<any[]>()

    if (error) throw error

    // Sinaliza quem da lista de espera já criou conta no site — ajuda o
    // admin a saber se, além de pedir contato/motivação por e-mail, essa
    // pessoa também pode ser encontrada e editada na aba de usuários.
    const emails = (data ?? [])
      .map(row => row.email)
      .filter((email: unknown): email is string => typeof email === "string" && email.length > 0)

    let profileEmails = new Set<string>()
    if (emails.length > 0) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("email")
        .in("email", emails)

      profileEmails = new Set(
        (profileRows ?? []).map((row: any) => (row.email as string).toLowerCase())
      )
    }

    const dataWithProfileFlag = (data ?? []).map(row => ({
      ...row,
      has_profile: typeof row.email === "string" && profileEmails.has(row.email.toLowerCase())
    }))

    return successResponse(dataWithProfileFlag)
  } catch (error) {
    return handleApiError(error)
  }
}
