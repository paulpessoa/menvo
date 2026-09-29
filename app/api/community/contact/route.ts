import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/utils/supabase/server"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { sendMentorContactEmail } from "@/lib/email/brevo"
import { z } from "zod"

const contactSchema = z.object({
  menteeId: z.string().uuid("ID do mentorado inválido"),
})

/**
 * Allows a mentor to send a contact notification to a mentee via email.
 * The mentee receives an email with the mentor's profile information,
 * encouraging them to connect on the platform.
 */
export async function POST(request: NextRequest) {
  try {
    const serverSupabase = await createServerClient()
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = contactSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Dados inválidos" },
        { status: 400 }
      )
    }
    const { menteeId } = parsed.data

    if (user.id === menteeId) {
      return NextResponse.json({ error: "Você não pode enviar mensagem para si mesmo" }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Verify sender is a mentor
    const { data: senderRoles } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id)

    const roleNames = (senderRoles || []).map((ur: any) => ur.roles?.name).filter(Boolean)
    if (!roleNames.includes("mentor") && !roleNames.includes("admin")) {
      return NextResponse.json({ error: "Apenas mentores podem usar esta funcionalidade" }, { status: 403 })
    }

    // Get mentor profile
    const { data: mentorProfile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, job_title, company, bio, expertise_areas, slug, linkedin_url")
      .eq("id", user.id)
      .single()

    if (!mentorProfile) {
      return NextResponse.json({ error: "Perfil do mentor não encontrado" }, { status: 404 })
    }

    // Get mentee profile + email
    const { data: menteeProfile } = await supabase
      .from("profiles")
      .select("full_name, first_name")
      .eq("id", menteeId)
      .single()

    const { data: menteeAuth } = await supabase.auth.admin.getUserById(menteeId)

    if (!menteeProfile || !menteeAuth?.user?.email) {
      return NextResponse.json({ error: "Mentorado não encontrado" }, { status: 404 })
    }

    // Send email
    await sendMentorContactEmail({
      menteeEmail: menteeAuth.user.email,
      menteeName: menteeProfile.first_name || menteeProfile.full_name || "Mentorado",
      mentorName: mentorProfile.full_name || "Um mentor",
      mentorJobTitle: mentorProfile.job_title || undefined,
      mentorCompany: mentorProfile.company || undefined,
      mentorBio: mentorProfile.bio || undefined,
      mentorExpertise: mentorProfile.expertise_areas || [],
      mentorSlug: mentorProfile.slug || user.id,
      mentorLinkedin: mentorProfile.linkedin_url || undefined,
      mentorAvatarUrl: mentorProfile.avatar_url || undefined,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[COMMUNITY CONTACT] Erro inesperado:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
