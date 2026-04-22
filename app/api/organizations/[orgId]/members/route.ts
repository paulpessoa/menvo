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

    const { data: members, error } = await supabase
      .from("profiles")
      .select(`
        *,
        user_roles!inner(roles(name))
      `)
      .eq("organization_id", orgId)
      .returns<any[]>()

    if (error) throw error

    return successResponse(members)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const supabase = await createClient()
    const { orgId } = await params
    const body = await request.json()
    const { user_id } = body

    if (!user_id) {
        return errorResponse("User ID is required", "INVALID_INPUT", 400)
    }

    const { data: member, error } = await supabase
      .from("profiles")
      .update({ organization_id: orgId } as any)
      .eq("id", user_id)
      .select()
      .single()

    if (error) throw error

    return successResponse(member, "Member added successfully", 201)
  } catch (error) {
    return handleApiError(error)
  }
}
