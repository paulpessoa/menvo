import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Iniciando upload de foto de perfil")

    // Verificar autenticação
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      console.error("❌ Token de autorização não fornecido")
      return NextResponse.json({ error: "Token de autorização necessário" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      console.error("❌ Erro de autenticação:", authError)
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    console.log("✅ Usuário autenticado:", user.id)

    // Processar o arquivo
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.error("❌ Nenhum arquivo fornecido")
      return NextResponse.json({ error: "Nenhum arquivo fornecido" }, { status: 400 })
    }

    // Validar tipo de arquivo
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      console.error("❌ Tipo de arquivo não permitido:", file.type)
      return NextResponse.json({ error: "Tipo de arquivo não permitido" }, { status: 400 })
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error("❌ Arquivo muito grande:", file.size)
      return NextResponse.json({ error: "Arquivo muito grande (máximo 5MB)" }, { status: 400 })
    }

    console.log("✅ Arquivo válido:", { name: file.name, type: file.type, size: file.size })

    // Gerar nome único para o arquivo
    const fileExtension = file.name.split(".").pop()
    const fileName = `${user.id}/${Date.now()}.${fileExtension}`

    console.log("🔄 Fazendo upload para:", fileName)

    // Converter arquivo para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    // Fazer upload para o Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("profile-photos")
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error("❌ Erro no upload:", uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    console.log("✅ Upload bem-sucedido:", uploadData.path)

    // Obter URL pública
    const { data: urlData } = supabaseAdmin.storage.from("profile-photos").getPublicUrl(fileName)

    const publicUrl = urlData.publicUrl

    console.log("✅ URL pública gerada:", publicUrl)

    // Atualizar perfil do usuário com a nova foto
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        profile_photo_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("❌ Erro ao atualizar perfil:", updateError)
      // Não retornar erro aqui, pois o upload foi bem-sucedido
    } else {
      console.log("✅ Perfil atualizado com nova foto")
    }

    return NextResponse.json({
      message: "Foto enviada com sucesso",
      url: publicUrl,
      path: uploadData.path,
    })
  } catch (error) {
    console.error("❌ Erro inesperado no upload:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
