const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAdminComponents() {
  console.log('🧪 Testing admin components data sources...\n')
  
  try {
    // Test 1: mentors_admin_view for admin panel
    console.log('1️⃣ Testing mentors_admin_view (for admin components)...')
    const { data: adminMentors, error: adminError } = await supabase
      .from('mentors_admin_view')
      .select('*')
    
    if (adminError) {
      console.log(`❌ Error: ${adminError.message}`)
    } else {
      const verified = adminMentors.filter(m => m.verified).length
      const pending = adminMentors.filter(m => !m.verified).length
      
      console.log(`✅ Admin view working`)
      console.log(`📊 Total mentors: ${adminMentors.length}`)
      console.log(`📊 Verified: ${verified}`)
      console.log(`📊 Pending: ${pending}`)
    }
    
    // Test 2: Public mentors_view
    console.log('\n2️⃣ Testing public mentors_view...')
    const { data: publicMentors, error: publicError } = await supabase
      .from('mentors_view')
      .select('*')
    
    if (publicError) {
      console.log(`❌ Error: ${publicError.message}`)
    } else {
      console.log(`✅ Public view working`)
      console.log(`📊 Public mentors: ${publicMentors.length}`)
    }
    
    // Test 3: Users with roles for user management
    console.log('\n3️⃣ Testing user management data...')
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        verified,
        user_roles (
          roles (
            name
          )
        )
      `)
      .limit(5)
    
    if (usersError) {
      console.log(`❌ Error: ${usersError.message}`)
    } else {
      console.log(`✅ User management data working`)
      console.log(`📊 Sample users: ${users.length}`)
      
      if (users.length > 0) {
        const sampleUser = users[0]
        const roles = sampleUser.user_roles?.map(ur => ur.roles?.name).filter(Boolean) || []
        console.log(`📋 Sample user: ${sampleUser.full_name} - Roles: ${roles.join(', ')}`)
      }
    }
    
    // Test 4: Mentor verification API compatibility
    console.log('\n4️⃣ Testing mentor verification API...')
    const { data: verifyData, error: verifyError } = await supabase
      .from('mentors_admin_view')
      .select('id, verified, full_name')
      .limit(1)
    
    if (verifyError) {
      console.log(`❌ Error: ${verifyError.message}`)
    } else if (verifyData && verifyData.length > 0) {
      console.log(`✅ Verification API data structure correct`)
      console.log(`📋 Sample mentor: ${verifyData[0].full_name} - Verified: ${verifyData[0].verified}`)
    }
    
    console.log('\n🎉 All admin component tests completed!')
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

testAdminComponents()