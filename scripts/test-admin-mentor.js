const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAdminMentor() {
  console.log('🔍 Testing admin user as mentor...')
  
  const adminId = '0737122a-0579-4981-9802-41883d6563a3'
  
  try {
    // Check if admin appears in mentors_view
    const { data, error } = await supabase
      .from('mentors_view')
      .select('*')
      .eq('id', adminId)
      .single()
    
    if (error) {
      console.error('❌ Error querying admin in mentors_view:', error)
      return
    }
    
    if (data) {
      console.log('✅ Admin user found in mentors_view!')
      console.log(`- Name: ${data.full_name}`)
      console.log(`- Email: ${data.email}`)
      console.log(`- Verified: ${data.verified}`)
      console.log(`- Bio: ${data.bio}`)
      console.log(`- Expertise: ${data.expertise_areas}`)
      console.log(`- Mentorship Topics: ${data.mentorship_topics}`)
      console.log(`- Job Title: ${data.current_position}`)
      console.log(`- Company: ${data.current_company}`)
      console.log(`- Active Roles: ${data.active_roles}`)
      console.log(`- Available: ${data.is_available}`)
    } else {
      console.log('❌ Admin user not found in mentors_view')
    }
    
    // Check user roles directly
    console.log('\n🔍 Checking user roles directly...')
    const { data: rolesData, error: rolesError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        first_name,
        last_name,
        verified,
        user_roles (
          roles (
            name
          )
        )
      `)
      .eq('id', adminId)
      .single()
    
    if (rolesError) {
      console.error('❌ Error querying user roles:', rolesError)
    } else {
      console.log('✅ User roles found:')
      const roles = rolesData.user_roles.map(ur => ur.roles.name)
      console.log(`- Roles: ${roles.join(', ')}`)
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

testAdminMentor()