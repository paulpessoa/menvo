import { createClient } from "@/lib/utils/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { handleApiError, errorResponse, successResponse } from "@/lib/api/error-handler"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401)
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id)
      .single()

    const isAdmin = (roleData as any)?.roles?.name === "admin"

    // Parse query parameters
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    let query = supabase
      .from("feedback" as any)
      .select(`
        *,
        user:profiles(full_name, avatar_url)
      `)
      .order("created_at", { ascending: false })

    // Apply filters based on user role
    if (!isAdmin) {
      query = (query as any).eq("user_id", user.id)
    }

    // Apply pagination
    const { data: feedback, error, count } = await (query as any)
      .range(offset, offset + limit - 1)

    if (error) throw error

    return successResponse({
      feedback,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user (optional for anonymous feedback)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const body = await request.json()
    const { rating, comment, email } = body

    if (!rating) {
      return errorResponse("Rating is required", "VALIDATION_ERROR", 400)
    }

    if (!user && !email) {
      return errorResponse("Email is required for anonymous feedback", "VALIDATION_ERROR", 400)
    }

    // Create feedback
    const insertData: any = {
      user_id: user?.id || null,
      rating: Number(rating),
      comment: comment || null,
      email: user ? null : email,
    };

    const { data: feedback, error } = await supabase
      .from("feedback")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error

    return successResponse(feedback, "Feedback submitted successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
