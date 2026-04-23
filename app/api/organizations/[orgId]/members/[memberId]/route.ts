import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import type { Database } from "@/lib/types/supabase"

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]
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
    const updateData = body as ProfileUpdate;
    const { data: member, error: updateError } = await (supabase
      .from("profiles") as any)
      .update(updateData)
      .eq("id", memberId)
      .eq("organization_id", orgId)
      .select()
      .single();

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

    // Remove from organization_members
    const { error: updateError } = await (supabase
      .from("organization_members") as any)
      .delete()
      .eq("user_id", memberId)
      .eq("organization_id", orgId);

    if (updateError) throw updateError

    return successResponse(null, "Member removed successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
