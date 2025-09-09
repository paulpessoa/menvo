import { createClient } from "@/utils/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    if (authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select(`
        role_id,
        roles!inner(name)
      `)
      .eq("user_id", user?.id)

    const isAdmin = userRoles?.some((ur: any) => ur.roles?.name === "admin")

    if (!isAdmin) {
      // Regular users can only see their own waiting list entry
      const { data: waitingListEntry, error } = await supabase
        .from("waiting_list")
        .select("*")
        .eq("email", user?.email)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error("Error fetching waiting list entry:", error)
        return NextResponse.json({ error: "Failed to fetch waiting list entry" }, { status: 500 })
      }

      return NextResponse.json({
        entry: waitingListEntry,
        isAdmin: false,
      })
    }

    // Admin view - get all entries with pagination
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status") || "all"
    const offset = (page - 1) * limit

    let query = supabase
      .from("waiting_list")
      .select("*")
      .order("created_at", { ascending: false })

    // Apply status filter
    if (status !== "all") {
      query = query.eq("status", status)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: waitingList, error } = await query

    if (error) {
      console.error("Error fetching waiting list:", error)
      return NextResponse.json({ error: "Failed to fetch waiting list" }, { status: 500 })
    }

    // Get total count for pagination
    let countQuery = supabase.from("waiting_list").select("*", { count: "exact", head: true })
    
    if (status !== "all") {
      countQuery = countQuery.eq("status", status)
    }

    const { count } = await countQuery

    return NextResponse.json({
      waitingList,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      isAdmin: true,
    })
  } catch (error) {
    console.error("Error in waiting list API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { name, email, whatsapp, reason } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        {
          error: "Name and email are required",
        },
        { status: 400 },
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          error: "Invalid email format",
        },
        { status: 400 },
      )
    }

    // Check if email already exists in waiting list
    const { data: existingEntry } = await supabase
      .from("waiting_list")
      .select("id, status")
      .eq("email", email)
      .single()

    if (existingEntry) {
      return NextResponse.json(
        {
          error: "Email already registered in waiting list",
          status: existingEntry.status,
        },
        { status: 409 },
      )
    }

    // Create waiting list entry
    const { data: waitingListEntry, error } = await supabase
      .from("waiting_list")
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        whatsapp: whatsapp?.trim() || null,
        reason: reason?.trim() || null,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating waiting list entry:", error)
      return NextResponse.json({ error: "Failed to join waiting list" }, { status: 500 })
    }

    return NextResponse.json({ 
      entry: waitingListEntry,
      message: "Successfully joined waiting list"
    }, { status: 201 })
  } catch (error) {
    console.error("Error in waiting list POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id, status } = body

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    if (authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select(`
        role_id,
        roles!inner(name)
      `)
      .eq("user_id", user?.id)

    const isAdmin = userRoles?.some((ur: any) => ur.roles?.name === "admin")

    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Validate required fields
    if (!id || !status) {
      return NextResponse.json(
        {
          error: "ID and status are required",
        },
        { status: 400 },
      )
    }

    // Validate status
    if (!["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        {
          error: "Invalid status. Must be pending, approved, or rejected",
        },
        { status: 400 },
      )
    }

    // Update waiting list entry
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === "approved") {
      updateData.approved_at = new Date().toISOString()
      updateData.approved_by = user.id
    }

    const { data: updatedEntry, error } = await supabase
      .from("waiting_list")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating waiting list entry:", error)
      return NextResponse.json({ error: "Failed to update waiting list entry" }, { status: 500 })
    }

    return NextResponse.json({ 
      entry: updatedEntry,
      message: `Entry ${status} successfully`
    })
  } catch (error) {
    console.error("Error in waiting list PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
