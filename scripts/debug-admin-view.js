const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugAdminView() {
  console.log('🔍 Debugging mentors_admin_view...\n')
  
  try {
    // Test direct query to see what's happening
    console.log('1️⃣ Testing direct profiles query with mentor role...')
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        verified,
        user_roles!inner (
          roles!inner (
            name
          )
        )
      `)
      .eq('user_roles.roles.name', 'mentor')
    
    if (profilesError) {
      console.log(`❌ Profiles error: ${profilesError.message}`)
    } else {
      console.log(`✅ Found ${profilesData.length} mentors via profiles table`)
      profilesData.forEach(mentor => {
        console.log(`- ${mentor.full_name} (${mentor.verified ? 'verified' : 'pending'})`)
      })
    }
    
    // Test admin view
    console.log('\n2️⃣ Testing mentors_admin_view...')
    const { data: adminData, error: adminError } = await supabase
      .from('mentors_admin_view')
      .select('id, full_name, verified')
    
    if (adminError) {
      console.log(`❌ Admin view error: ${adminError.message}`)
      console.log('This suggests mentors_admin_view might not exist or have issues')
    } else {
      console.log(`✅ Admin view returned ${adminData.length} mentors`)
      adminData.forEach(mentor => {
        console.log(`- ${mentor.full_name} (${mentor.verified ? 'verified' : 'pending'})`)
      })
    }
    
    // Test public view for comparison
    console.log('\n3️⃣ Testing public mentors_view for comparison...')
    const { data: publicData, error: publicError } = await supabase
      .from('mentors_view')
      .select('id, full_name, verified')
    
    if (publicError) {
      console.log(`❌ Public view error: ${publicError.message}`)
    } else {
      console.log(`✅ Public view returned ${publicData.length} mentors`)
      publicData.forEach(mentor => {
        console.log(`- ${mentor.full_name} (verified: ${mentor.verified})`)
      })
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

debugAdminView()