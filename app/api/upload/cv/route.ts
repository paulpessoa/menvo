import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables")
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      console.error("❌ No authorization token provided")
      return NextResponse.json({ 
        error: "Token de autorização necessário" 
      }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      console.error("❌ Authentication error:", authError)
      return NextResponse.json({ 
        error: "Token inválido",
        details: authError?.message 
      }, { status: 401 })
    }

    // Process the file
    const formData = await request.formData()
    const file = formData.get("file") as File
    const enableAnalysis = formData.get("enableAnalysis") === "true"

    if (!file) {
      console.error("❌ No file provided")
      return NextResponse.json({ 
        error: "Nenhum arquivo fornecido" 
      }, { status: 400 })
    }

    // Validate file type (PDF only)
    if (file.type !== "application/pdf") {
      console.error("❌ Invalid file type:", file.type)
      return NextResponse.json({ 
        error: "Apenas arquivos PDF são aceitos",
        receivedType: file.type 
      }, { status: 400 })
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error("❌ File too large:", file.size)
      return NextResponse.json({ 
        error: "Arquivo muito grande (máximo 5MB)",
        maxSize,
        actualSize: file.size 
      }, { status: 400 })
    }

    // Check if user already has a CV and remove it
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("cv_url")
      .eq("id", user.id)
      .single()

    if (existingProfile?.cv_url) {
      // Extract file path from URL
      const urlParts = existingProfile.cv_url.split('/');
      const existingFileName = urlParts[urlParts.length - 1];
      const existingFilePath = `${user.id}/${existingFileName}`;
      
      const { error: deleteError } = await supabaseAdmin.storage
        .from("cvs")
        .remove([existingFilePath])
      
      if (deleteError) {
        console.warn("⚠️ Could not delete existing CV:", deleteError);
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `cv-${timestamp}.pdf`
    const filePath = `${user.id}/${fileName}`

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    // Check if bucket exists and is accessible
    const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketError) {
      console.error("❌ Error checking buckets:", bucketError);
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("cvs")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error("❌ Storage upload error:", uploadError)
      return NextResponse.json({ 
        error: "Erro no upload para o storage",
        details: uploadError.message,
        code: uploadError.name 
      }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("cvs")
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    // Update user profile with new CV URL
    const { data: profileData, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        cv_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()

    if (updateError) {
      console.error("❌ Profile update error:", updateError)
      return NextResponse.json({ 
        error: "Upload realizado, mas falha ao atualizar perfil",
        details: updateError.message,
        url: publicUrl 
      }, { status: 500 })
    }

    return NextResponse.json({
      message: "CV enviado com sucesso",
      url: publicUrl,
      path: uploadData.path,
      fileName: file.name,
      fileSize: file.size,
      profile: profileData,
    })

  } catch (error) {
    console.error("❌ Unexpected CV upload error:", error)
    
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ 
        error: "Token de autorização necessário" 
      }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ 
        error: "Token inválido" 
      }, { status: 401 })
    }

    // Get current CV URL
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("cv_url")
      .eq("id", user.id)
      .single()

    if (!profile?.cv_url) {
      return NextResponse.json({ 
        error: "Nenhum CV encontrado" 
      }, { status: 404 })
    }

    // Extract file path from URL
    const urlParts = profile.cv_url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `${user.id}/${fileName}`;

    // Delete from storage
    const { error: deleteError } = await supabaseAdmin.storage
      .from("cvs")
      .remove([filePath])

    if (deleteError) {
      console.error("❌ Storage deletion error:", deleteError)
      return NextResponse.json({ 
        error: "Erro ao deletar arquivo",
        details: deleteError.message 
      }, { status: 500 })
    }

    // Update profile to remove CV URL
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        cv_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("❌ Profile update error:", updateError)
      return NextResponse.json({ 
        error: "Arquivo deletado, mas falha ao atualizar perfil",
        details: updateError.message 
      }, { status: 500 })
    }

    // Delete metadata
    await supabaseAdmin
      .from("cv_metadata")
      .delete()
      .eq("user_id", user.id)

    return NextResponse.json({
      message: "CV removido com sucesso"
    })

  } catch (error) {
    console.error("❌ Unexpected CV deletion error:", error)
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
