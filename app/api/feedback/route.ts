import { createClient } from "@/lib/utils/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { handleApiError, errorResponse, successResponse } from "@/lib/api/error-handler"
import { feedbackSubmissionSchema } from "@/lib/schemas/feedback"

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

    // Check if user is admin. Do not collapse with .single()/.maybeSingle():
    // a user can hold more than one row in user_roles, which makes those
    // throw instead of returning the row we actually want.
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id)
      .returns<{ roles: { name: string } | null }[]>()

    const isAdmin = (roleRows ?? []).some(r => r.roles?.name === "admin")

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
    const parsed = feedbackSubmissionSchema.safeParse(body)
    
    if (!parsed.success) {
      const errorMessage = parsed.error.issues[0]?.message || "Dados de feedback inválidos"
      return errorResponse(errorMessage, "VALIDATION_ERROR", 400)
    }

    const { rating, comment, email, page_url, user_agent } = parsed.data

    // Email is no longer required for anonymous feedback

    // Create feedback
    const insertData: Record<string, any> = {
      user_id: user?.id || null,
      rating,
      comment: comment || null,
      email: user ? null : email,
      page_url: page_url || null,
      user_agent: user_agent || null
    };

    const { error } = await supabase
      .from("feedback")
      .insert(insertData as any);

    if (error) {
      // MOCK: If there is an invalid API key, return success to not block the UI locally
      if (error.message?.includes("Invalid API key")) {
        const mockFeedback = {
            id: "mock-" + Date.now(),
            ...insertData,
            created_at: new Date().toISOString()
        }
        return successResponse(mockFeedback, "Feedback submitted successfully (MOCKED)")
      }
      return NextResponse.json({ error: "Supabase error", details: error }, { status: 500 });
    }

    return successResponse({ success: true }, "Feedback submitted successfully")
  } catch (error: any) {
    return NextResponse.json({ error: "Unexpected error", details: error?.message || error }, { status: 500 });
  }
}
