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
    const { userId, role } = await request.json()

    console.log('🔄 Role selection request:', { userId, role })

    // Validate input
    if (!userId || !role) {
      console.log('❌ Missing required fields')
      return NextResponse.json(
        { error: 'userId and role are required' },
        { status: 400 }
      )
    }

    if (!['mentor', 'mentee'].includes(role)) {
      console.log('❌ Invalid role:', role)
      return NextResponse.json(
        { error: 'Invalid role. Must be mentor or mentee' },
        { status: 400 }
      )
    }

    // Verify user exists in auth.users
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (userError || !userData.user) {
      console.log('❌ User not found:', userId)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get role ID using admin client
    console.log('🔄 Fetching role data for:', role)
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', role)
      .single()

    if (roleError) {
      console.error('❌ Error fetching role:', roleError)
      return NextResponse.json(
        { error: 'Failed to fetch role data' },
        { status: 500 }
      )
    }

    console.log('✅ Role data found:', roleData)

    // Check if user already has a role
    console.log('🔄 Checking existing role for user:', userId)
    const { data: existingRole, error: existingRoleError } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existingRoleError && existingRoleError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected for new users
      console.error('❌ Error checking existing role:', existingRoleError)
      return NextResponse.json(
        { error: 'Failed to check existing role' },
        { status: 500 }
      )
    }

    if (existingRole) {
      console.log('🔄 Updating existing role')
      // Update existing role
      const { error: updateError } = await supabaseAdmin
        .from('user_roles')
        .update({ role_id: roleData.id })
        .eq('user_id', userId)

      if (updateError) {
        console.error('❌ Error updating user role:', updateError)
        return NextResponse.json(
          { error: 'Failed to update user role' },
          { status: 500 }
        )
      }
      console.log('✅ Role updated successfully')
    } else {
      console.log('🔄 Creating new role assignment')
      // Create new user_role entry
      const { error: insertError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleData.id
        })

      if (insertError) {
        console.error('❌ Error creating user role:', insertError)
        return NextResponse.json(
          { error: 'Failed to create user role' },
          { status: 500 }
        )
      }
      console.log('✅ Role created successfully')
    }

    // Update custom claims in JWT
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/custom-claims`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ userId })
      })
    } catch (claimsError) {
      console.error('Error updating custom claims:', claimsError)
      // Don't fail the request if custom claims update fails
    }

    console.log('✅ Role selection completed successfully')
    return NextResponse.json({
      success: true,
      role,
      message: 'Role selected successfully'
    })

  } catch (error) {
    console.error('Error in role selection:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}