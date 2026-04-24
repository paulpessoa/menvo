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
    console.log("🔄 Starting CV upload");

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
    const enableAnalysis = formData.get("enableAnalysis") === "true"

    if (!file) {
      console.error("❌ No file provided")
      return NextResponse.json({ 
        error: "Nenhum arquivo fornecido" 
      }, { status: 400 })
    }

    console.log("📄 CV file received:", { 
      name: file.name, 
      type: file.type, 
      size: file.size,
      enableAnalysis 
    });

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

    console.log("✅ File validation passed")

    // Check if user already has a CV and remove it
    console.log("🔍 Checking for existing CV...");
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("cv_url")
      .eq("id", user.id)
      .single()

    if (existingProfile?.cv_url) {
      console.log("🗑️ Removing existing CV...");
      // Extract file path from URL
      const urlParts = existingProfile.cv_url.split('/');
      const existingFileName = urlParts[urlParts.length - 1];
      const existingFilePath = `${user.id}/${existingFileName}`;
      
      const { error: deleteError } = await supabaseAdmin.storage
        .from("cvs")
        .remove([existingFilePath])
      
      if (deleteError) {
        console.warn("⚠️ Could not delete existing CV:", deleteError);
      } else {
        console.log("✅ Existing CV removed");
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `cv-${timestamp}.pdf`
    const filePath = `${user.id}/${fileName}`

    console.log("📤 Uploading CV to storage:", filePath)

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    // Check if bucket exists and is accessible
    console.log("🪣 Checking storage bucket...");
    const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketError) {
      console.error("❌ Error checking buckets:", bucketError);
    } else {
      const cvsBucket = buckets.find(b => b.id === 'cvs');
      console.log("📋 Available buckets:", buckets.map(b => b.id));
      console.log("✅ CVs bucket found:", !!cvsBucket);
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

    console.log("✅ Upload successful:", uploadData.path)

    // Get public URL
    console.log("🔗 Generating public URL...");
    const { data: urlData } = supabaseAdmin.storage
      .from("cvs")
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl
    console.log("✅ Public URL generated:", publicUrl)

    // Skip analysis for MVP - just store the file
    console.log("📝 Skipping CV analysis for MVP version");

    // Update user profile with new CV URL
    console.log("💾 Updating profile with new CV URL...");
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

    console.log("✅ Profile updated successfully");
    
    const duration = Date.now() - startTime;
    console.log(`🎉 CV upload completed in ${duration}ms`);

    return NextResponse.json({
      message: "CV enviado com sucesso",
      url: publicUrl,
      path: uploadData.path,
      fileName: file.name,
      fileSize: file.size,
      profile: profileData,
    })

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("❌ Unexpected CV upload error:", error)
    console.error(`💥 CV upload failed after ${duration}ms`);
    
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : 'Unknown error',
      duration 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log("🗑️ Starting CV deletion");

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

    console.log("✅ CV deleted successfully");

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
