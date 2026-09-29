import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/utils/supabase/server"

export async function POST(request: Request) {
  const supabase = createServerClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { category, description, evidence_paths, reported_email } = body

    if (!category || !description) {
      return NextResponse.json({ error: "Categoria e descrição são obrigatórios." }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("user_reports")
      .insert({
        reporter_id: user.id,
        category,
        description,
        evidence_paths: evidence_paths || [],
        reported_email: reported_email || null,
        status: "pending"
      })
      .select("id")
      .single()

    if (error) {
      throw error
    }

    // TODO: Disparar email para o Admin informando da denúncia
    
    return NextResponse.json({ success: true, reportId: data.id })
  } catch (error) {
    console.error("[REPORTS_API]", error)
    return NextResponse.json(
      { error: "Erro ao enviar denúncia." },
      { status: 500 }
    )
  }
}
