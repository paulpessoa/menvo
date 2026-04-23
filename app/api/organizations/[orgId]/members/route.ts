import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import type { Database } from "@/lib/types/supabase"

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]
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
        return errorResponse("User ID is required", "VALIDATION_ERROR", 400)
    }

    // Cast as any here is necessary because of Supabase table discovery issues during build
    const insertData: any = { 
      organization_id: orgId, 
      user_id: user_id,
      role: 'member',
      status: 'active'
    };
    const { data: member, error: updateError } = await (supabase
      .from("organization_members") as any)
      .insert(insertData)
      .select()
      .single();

    if (updateError) throw updateError

    return successResponse(member, "Member added successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
