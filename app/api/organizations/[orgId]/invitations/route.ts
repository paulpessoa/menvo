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

    // Check if user is org admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401)

    const { data: membership } = await (supabase
      .from("organization_members" as any)
      .select("role, status")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .single() as any)

    if (!membership || membership.role !== "admin" || membership.status !== "active") {
      return errorResponse("Forbidden", "FORBIDDEN", 403)
    }

    const { email, role } = await request.json()

    // Create invitation
    const { data: invitation, error: inviteError } = await (supabase
      .from("organization_invitations" as any)
      // @ts-ignore
      .insert({
        organization_id: orgId,
        email: email.toLowerCase().trim(),
        role: role || "mentee",
        invited_by: user.id,
        status: "pending",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single() as any)

    if (inviteError) throw inviteError

    return successResponse(invitation, "Invitation sent successfully")
  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const supabase = await createClient()
    const { orgId } = await params

    const { data: invitations, error } = await (supabase
      .from("organization_invitations" as any)
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false }) as any)

    if (error) throw error

    return successResponse(invitations)
  } catch (error) {
    return handleApiError(error)
  }
}
