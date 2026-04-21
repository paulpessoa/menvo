import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Verificar Autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // 2. Processar o Arquivo
    const formData = await request.formData()
    const file = formData.get("file") as File
    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    const fileExt = file.name.split(".").pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `hub-resources/${fileName}`

    // 3. Upload para o Supabase Storage (Bucket: public-assets)
    const { error: uploadError } = await supabase.storage
      .from("public-assets")
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // 4. Gerar URL Pública
    const { data: { publicUrl } } = supabase.storage
      .from("public-assets")
      .getPublicUrl(filePath)

    return NextResponse.json({ url: publicUrl })
  } catch (error: any) {
    console.error("[UPLOAD HUB] Erro:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
