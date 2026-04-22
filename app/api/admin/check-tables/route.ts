import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// This endpoint checks if required tables exist and their structure
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Check Auth & Admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Use maybeSingle and returns<any> to avoid never issues
    const { data: profile } = await supabase
      .from("profiles")
      .select("*, user_roles!inner(roles!inner(name))")
      .eq("id", user.id)
      .returns<any>()
      .maybeSingle()

    const roles = profile?.user_roles?.map((ur: any) => ur.roles?.name) || []
    if (!roles.includes("admin")) {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 })
    }

    // 2. Check if tables exist
    const tablesToCheck = [
        'volunteer_activities',
        'admin_audit_logs',
        'organizations',
        'organization_members',
        'organization_invitations'
    ]

    const tableStatus: any = {}

    for (const tableName of tablesToCheck) {
        // We use a simple query instead of RPC if RPC doesn't exist
        const { error } = await supabase
            .from(tableName as any)
            .select('count', { count: 'exact', head: true })
            .limit(0)
        
        tableStatus[tableName] = !error || (error.code !== '42P01') // 42P01 is undefined table
    }

    return NextResponse.json({ 
      success: true,
      tables: tableStatus
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: "Internal server error",
      details: error.message
    }, { status: 500 })
  }
}
