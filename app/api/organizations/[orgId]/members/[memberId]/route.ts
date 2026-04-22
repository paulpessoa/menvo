import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; memberId: string }> }
) {
  try {
    const supabase = await createClient()
    const { orgId, memberId } = await params

    const { data: member, error } = await supabase
      .from("profiles")
      .select(`
        *,
        user_roles(roles(name))
      `)
      .eq("id", memberId)
      .eq("organization_id", orgId)
      .returns<any>()
      .maybeSingle()

    if (error || !member) {
      return errorResponse("Member not found", "NOT_FOUND", 404)
    }

    return successResponse(member)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; memberId: string }> }
) {
  try {
    const supabase = await createClient()
    const { orgId, memberId } = await params
    const body = await request.json()

    const { data: member, error } = await supabase
      .from("profiles")
      .update(body as any)
      .eq("id", memberId)
      .eq("organization_id", orgId)
      .select()
      .returns<any>()
      .single()

    if (error) throw error

    return successResponse(member, "Member updated successfully")
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; memberId: string }> }
) {
  try {
    const supabase = await createClient()
    const { orgId, memberId } = await params

    const { error } = await supabase
      .from("profiles")
      .update({ organization_id: null } as any)
      .eq("id", memberId)
      .eq("organization_id", orgId)

    if (error) throw error

    return successResponse(null, "Member removed from organization")
  } catch (error) {
    return handleApiError(error)
  }
}
