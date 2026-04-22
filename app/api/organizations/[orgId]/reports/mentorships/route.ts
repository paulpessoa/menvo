import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const supabase = await createClient()
    const { orgId } = await params

    const { data: sessions, error } = await supabase
      .from("appointments")
      .select(`
        *,
        mentor:profiles!mentor_id(full_name, avatar_url),
        mentee:profiles!mentee_id(full_name, avatar_url)
      `)
      .eq("organization_id", orgId)
      .order("scheduled_at", { ascending: false })
      .returns<any[]>()

    if (error) throw error

    return successResponse(sessions)
  } catch (error) {
    return handleApiError(error)
  }
}
