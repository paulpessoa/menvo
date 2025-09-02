import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Get user profile and role information
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('verified')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Get user role
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select(`
        roles (
          name
        )
      `)
      .eq('user_id', userId)
      .single()

    // Role might be null for new users, which is expected
    const roleName = (userRole?.roles as any)?.name || null

    // Update user metadata with custom claims
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        app_metadata: {
          role: roleName,
          verified: profile.verified || false
        }
      }
    )

    if (updateError) {
      console.error('Error updating user metadata:', updateError)
      return NextResponse.json(
        { error: 'Failed to update custom claims' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      claims: {
        role: roleName,
        verified: profile.verified || false
      }
    })

  } catch (error) {
    console.error('Error in custom claims update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}