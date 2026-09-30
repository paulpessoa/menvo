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

    let dataClient = supabase as any;
    if (isAdmin) {
      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
      dataClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
    }

    let query = dataClient
      .from("feedback")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })

    // Apply filters based on user role
    if (!isAdmin) {
      query = query.eq("user_id", user.id)
    }

    // Apply pagination
    const { data: rawFeedback, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Fetch user profiles manually to bypass missing foreign key error
    const userIds = Array.from(new Set((rawFeedback || []).filter((f: any) => f.user_id).map((f: any) => f.user_id)));
    let profilesMap: Record<string, any> = {};
    
    if (userIds.length > 0) {
      const { data: profiles } = await dataClient
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);
        
      profilesMap = (profiles || []).reduce((acc: any, p: any) => ({ ...acc, [p.id]: p }), {});
    }

    const feedback = (rawFeedback || []).map((f: any) => ({
      ...f,
      user: f.user_id ? profilesMap[f.user_id] || null : null
    }));

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

    const { rating, comment, email, source, context } = parsed.data

    // Create feedback
    const insertData: Record<string, any> = {
      user_id: user?.id || null,
      rating,
      comment: comment || null,
      email: user ? null : email,
      source: source || "platform",
      context: context || {}
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
