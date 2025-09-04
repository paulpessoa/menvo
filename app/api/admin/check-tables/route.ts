import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// This endpoint checks if required tables exist and their structure
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", user.id)
      .single()

    if (profile?.user_role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Check if volunteer_activities table exists
    const { data: tableCheck, error: tableError } = await supabase
      .rpc('check_table_exists', { table_name: 'volunteer_activities' })

    let volunteerTableExists = false
    if (!tableError && tableCheck) {
      volunteerTableExists = true
    } else {
      // Fallback: try to query the table
      const { error: queryError } = await supabase
        .from("volunteer_activities")
        .select("id")
        .limit(1)
      
      volunteerTableExists = !queryError
    }

    // Check if is_volunteer column exists in profiles
    const { data: columnCheck, error: columnError } = await supabase
      .from("profiles")
      .select("is_volunteer")
      .limit(1)

    const isVolunteerColumnExists = !columnError

    // Get table counts if they exist
    let volunteerActivitiesCount = 0
    let profilesWithVolunteerFlag = 0

    if (volunteerTableExists) {
      const { count } = await supabase
        .from("volunteer_activities")
        .select("*", { count: "exact", head: true })
      
      volunteerActivitiesCount = count || 0
    }

    if (isVolunteerColumnExists) {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_volunteer", true)
      
      profilesWithVolunteerFlag = count || 0
    }

    return NextResponse.json({
      tables: {
        volunteer_activities: {
          exists: volunteerTableExists,
          count: volunteerActivitiesCount
        },
        profiles_is_volunteer_column: {
          exists: isVolunteerColumnExists,
          volunteers_count: profilesWithVolunteerFlag
        }
      },
      migration_needed: !volunteerTableExists || !isVolunteerColumnExists,
      recommendations: {
        ...((!volunteerTableExists) && {
          create_volunteer_activities: "Run the migration script to create volunteer_activities table"
        }),
        ...((!isVolunteerColumnExists) && {
          add_is_volunteer_column: "Add is_volunteer column to profiles table"
        })
      }
    })

  } catch (error) {
    console.error("Error checking tables:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// POST endpoint to apply the migration
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", user.id)
      .single()

    if (profile?.user_role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // This endpoint provides instructions but doesn't execute SQL directly
    // for security reasons. The actual migration should be run in Supabase dashboard.
    
    return NextResponse.json({
      message: "Migration instructions provided",
      instructions: [
        "1. Go to Supabase Dashboard → SQL Editor",
        "2. Copy and paste the SQL from scripts/check-volunteer-tables.sql",
        "3. Execute the script",
        "4. Verify the tables were created successfully",
        "5. Test the volunteer activities endpoints"
      ],
      sql_file: "scripts/check-volunteer-tables.sql",
      warning: "This endpoint does not execute SQL directly for security reasons. Please run the migration manually in Supabase dashboard."
    })

  } catch (error) {
    console.error("Error in migration endpoint:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}