import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string, memberId: string }> }
) {
  try {
    const supabase = await createClient()
    const { orgId, memberId } = await params
    const body = await request.json()

    // Update member (actually updates the profile)
    // Cast as any is needed for table discovery during build
    const { data: member, error: updateError } = await (supabase
      .from("profiles" as any)
      .update(body)
      .eq("id", memberId)
      .eq("organization_id", orgId)
      .select()
      .single() as any)

    if (updateError) throw updateError

    return successResponse(member, "Member updated successfully")
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string, memberId: string }> }
) {
  try {
    const supabase = await createClient()
    const { orgId, memberId } = await params

    // Remove organization_id from profile
    const { error: updateError } = await (supabase
      .from("profiles" as any)
      .update({ organization_id: null })
      .eq("id", memberId)
      .eq("organization_id", orgId) as any)

    if (updateError) throw updateError

    return successResponse(null, "Member removed successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
