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
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const searchParams = new URL(request.url).searchParams
    const orgId = searchParams.get("orgId")

    if (!file || !orgId) {
      return NextResponse.json({ error: "Missing file or orgId" }, { status: 400 })
    }

    // Check if user is admin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id)
      .single()
    
    const isAdmin = (roleData?.roles as any)?.name === 'admin'
    if (!isAdmin) {
        return NextResponse.json({ error: "Only admins can upload org logos" }, { status: 403 })
    }

    const fileExtension = file.name.split(".").pop()
    const fileName = `organizations/${orgId}/${Date.now()}.${fileExtension}`

    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("avatars") // Reusing avatars bucket or use 'logos' if it exists
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) throw uploadError

    const { data: urlData } = supabaseAdmin.storage
      .from("avatars")
      .getPublicUrl(fileName)

    const publicUrl = urlData.publicUrl

    // Update organization
    await supabaseAdmin
      .from("organizations")
      .update({ logo_url: publicUrl })
      .eq("id", orgId)

    return NextResponse.json({ url: publicUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
