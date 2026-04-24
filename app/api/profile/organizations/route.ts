
import { createClient } from "@/lib/utils/supabase/server"
import { NextResponse } from "next/server"
import { successResponse, handleApiError } from "@/lib/api/error-handler"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data: orgs, error } = await supabase
      .from("organization_members")
      .select(`
        role,
        status,
        organization:organizations(
          id,
          name,
          slug,
          logo_url
        )
      `)
      .eq("user_id", user.id)
      .neq("status", "declined")
      .neq("status", "left")

    if (error) throw error

    return successResponse(orgs)
  } catch (error) {
    return handleApiError(error)
  }
}
