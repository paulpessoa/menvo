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
  const startTime = Date.now();
  
  try {
    console.log("🔄 Starting profile photo upload");

    // Check authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      console.error("❌ No authorization token provided")
      return NextResponse.json({ 
        error: "Token de autorização necessário" 
      }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    console.log("🔍 Validating token...");
    
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

    console.log("✅ User authenticated:", user.id)

    // Process the file
    console.log("📁 Processing form data...");
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.error("❌ No file provided")
      return NextResponse.json({ 
        error: "Nenhum arquivo fornecido" 
      }, { status: 400 })
    }

    console.log("📄 File received:", { 
      name: file.name, 
      type: file.type, 
      size: file.size 
    });

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      console.error("❌ Invalid file type:", file.type)
      return NextResponse.json({ 
        error: "Tipo de arquivo não permitido. Use JPG, PNG, WebP ou GIF",
        allowedTypes 
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

    console.log("✅ File validation passed")

    // Generate unique filename
    const fileExtension = file.name.split(".").pop()
    const timestamp = Date.now();
    const fileName = `${user.id}/${timestamp}.${fileExtension}`

    console.log("📤 Uploading to storage:", fileName)

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    // Check if bucket exists and is accessible
    console.log("🪣 Checking storage bucket...");
    const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketError) {
      console.error("❌ Error checking buckets:", bucketError);
    } else {
      const avatarsBucket = buckets.find(b => b.id === 'avatars');
      console.log("📋 Available buckets:", buckets.map(b => b.id));
      console.log("✅ Avatars bucket found:", !!avatarsBucket);
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(fileName, fileBuffer, {
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

    console.log("✅ Upload successful:", uploadData.path)

    // Get public URL
    console.log("🔗 Generating public URL...");
    const { data: urlData } = supabaseAdmin.storage
      .from("avatars")
      .getPublicUrl(fileName)

    const publicUrl = urlData.publicUrl
    console.log("✅ Public URL generated:", publicUrl)

    // Update user profile with new photo
    console.log("💾 Updating profile with new avatar URL...");
    const { data: profileData, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        avatar_url: publicUrl,
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

    console.log("✅ Profile updated successfully");
    
    const duration = Date.now() - startTime;
    console.log(`🎉 Upload completed in ${duration}ms`);

    return NextResponse.json({
      message: "Foto enviada com sucesso",
      url: publicUrl,
      path: uploadData.path,
      profile: profileData,
    })
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("❌ Unexpected upload error:", error)
    console.error(`💥 Upload failed after ${duration}ms`);
    
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : 'Unknown error',
      duration 
    }, { status: 500 })
  }
}
