import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/services/auth/auth.service"
import { getUserFromRequest } from "@/lib/auth/server-utils"
import { UUID } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || !user.role || !["admin", "moderator"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      user_id,
      title,
      company,
      experience_years,
      expertise_areas,
      topics,
      inclusion_tags,
      linkedin_url,
      portfolio_url,
      academic_background,
      current_work,
      areas_of_interest,
      session_duration,
      timezone,
      status = "pending_verification"
    } = body

    if (
      !user_id ||
      !title ||
      !experience_years ||
      !expertise_areas ||
      !topics
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        job_title: title,
        company: company,
        mentorship_topics: topics,
        expertise_areas: expertise_areas,
        linkedin_url,
        timezone,
        verification_status:
          status === "pending_verification" ? "pending" : "approved",
        updated_at: new Date().toISOString()
      })
      .eq("id", user_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 2. Garantir que o usuário tenha a role de mentor
    const { error: roleError } = await supabase.from("user_roles").upsert({
      user_id: user_id as string,
      role_id: 2
    })

    return NextResponse.json({ success: true, mentor: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
