import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const supabase = await createClient()
    const { orgId } = await params
    const { emails, role_id } = await request.json()

    if (!emails || !Array.isArray(emails)) {
      return errorResponse("Emails array is required", "INVALID_INPUT", 400)
    }

    const results = []
    for (const email of emails) {
      const { data, error } = await supabase
        .from("organization_invitations")
        .insert({
          organization_id: orgId,
          email,
          role_id: role_id || null,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        } as any)
        .select()
        .single()

      if (error) {
        results.push({ email, success: false, error: error.message })
      } else {
        results.push({ email, success: true, invitation: data })
      }
    }

    return successResponse(results, "Bulk invitations processed")
  } catch (error) {
    return handleApiError(error)
  }
}
