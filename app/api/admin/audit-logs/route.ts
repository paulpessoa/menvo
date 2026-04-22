import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401)
    }

    // Buscar logs com joins manuais ou tipagem explicita
    const { data: logs, error } = await supabase
      .from("admin_audit_logs")
      .select(`
        *,
        admin:profiles!admin_id(email, full_name),
        target:profiles!target_id(full_name)
      `)
      .order("created_at", { ascending: false })
      .limit(100)
      .returns<any[]>()

    if (error) throw error

    const searchParams = new URL(request.url).searchParams
    const search = searchParams.get("search") || ""
    const searchLower = search.toLowerCase()

    const filteredLogs = (logs || []).filter((log: any) => {
        if (!search) return true
        return (
            log.action_type?.toLowerCase().includes(searchLower) ||
            log.admin?.email?.toLowerCase().includes(searchLower) ||
            log.admin?.full_name?.toLowerCase().includes(searchLower) ||
            log.target_user_email?.toLowerCase().includes(searchLower) ||
            log.target?.full_name?.toLowerCase().includes(searchLower)
        )
    })

    return successResponse(filteredLogs)
  } catch (error) {
    return handleApiError(error)
  }
}
