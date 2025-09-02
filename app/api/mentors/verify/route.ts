import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Admin client with service role key for bypassing RLS
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
    const { mentorId, verified, adminId } = await request.json()

    // Validate input
    if (!mentorId || typeof verified !== 'boolean') {
      return NextResponse.json(
        { error: 'mentorId and verified status are required' },
        { status: 400 }
      )
    }

    // For MVP, we'll trust the frontend to send the adminId
    // In production, you'd want to verify the admin session server-side
    if (adminId) {
      // Verify that the requesting user is an admin
      const { data: userRole, error: roleError } = await supabaseAdmin
        .from('user_roles')
        .select(`
          roles (
            name
          )
        `)
        .eq('user_id', adminId)
        .single()

      if (roleError || (userRole?.roles as any)?.name !== 'admin') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      }
    }

    // Verify that the target user is actually a mentor
    const { data: mentorRole, error: mentorRoleError } = await supabaseAdmin
      .from('user_roles')
      .select(`
        roles (
          name
        )
      `)
      .eq('user_id', mentorId)
      .single()

    if (mentorRoleError || (mentorRole?.roles as any)?.name !== 'mentor') {
      return NextResponse.json(
        { error: 'User is not a mentor' },
        { status: 400 }
      )
    }

    // Update the mentor's verified status
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        verified,
        updated_at: new Date().toISOString()
      })
      .eq('id', mentorId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating mentor verification:', updateError)
      return NextResponse.json(
        { error: 'Failed to update mentor verification status' },
        { status: 500 }
      )
    }

    // Log the verification action for audit purposes
    if (adminId) {
      const { error: logError } = await supabaseAdmin
        .from('verification_logs')
        .insert({
          mentor_id: mentorId,
          admin_id: adminId,
          action: verified ? 'verified' : 'unverified',
          timestamp: new Date().toISOString()
        })

      // Don't fail the request if logging fails, just log the error
      if (logError) {
        console.error('Error logging verification action:', logError)
      }
    }

    // Update custom claims in JWT to reflect the new verification status
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/custom-claims`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ userId: mentorId })
      })
    } catch (claimsError) {
      console.error('Error updating custom claims:', claimsError)
      // Don't fail the request if custom claims update fails
    }

    return NextResponse.json({
      success: true,
      mentor: updatedProfile,
      message: `Mentor ${verified ? 'verified' : 'unverified'} successfully`
    })

  } catch (error) {
    console.error('Error in mentor verification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}