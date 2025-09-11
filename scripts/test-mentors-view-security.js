const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testMentorsViewSecurity() {
  console.log('🔒 Testing mentors_view security policies...\n')
  
  try {
    // Test 1: Anonymous access (should only see verified mentors)
    console.log('1️⃣ Testing anonymous access...')
    const { data: anonData, error: anonError } = await supabase
      .from('mentors_view')
      .select('id, verified, email')
    
    if (anonError) {
      console.log(`❌ Anonymous access error: ${anonError.message}`)
    } else {
      const verifiedCount = anonData.filter(m => m.verified).length
      const unverifiedCount = anonData.filter(m => !m.verified).length
      
      console.log(`✅ Anonymous access successful`)
      console.log(`📊 Verified mentors visible: ${verifiedCount}`)
      console.log(`📊 Unverified mentors visible: ${unverifiedCount}`)
      
      if (unverifiedCount > 0) {
        console.log('⚠️  Warning: Unverified mentors are visible to anonymous users')
      }
    }
    
    // Test 2: Check if view respects underlying table policies
    console.log('\n2️⃣ Testing underlying table policy inheritance...')
    
    // Query profiles directly with same conditions as mentors_view
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id, 
        verified, 
        email,
        user_roles!inner (
          roles!inner (
            name
          )
        )
      `)
      .eq('user_roles.roles.name', 'mentor')
    
    if (profilesError) {
      console.log(`❌ Profiles query error: ${profilesError.message}`)
    } else {
      console.log(`✅ Profiles query successful`)
      console.log(`📊 Mentors from profiles table: ${profilesData.length}`)
      
      // Compare with mentors_view count
      const { count: viewCount } = await supabase
        .from('mentors_view')
        .select('*', { count: 'exact', head: true })
      
      console.log(`📊 Mentors from mentors_view: ${viewCount}`)
      
      if (profilesData.length === viewCount) {
        console.log('✅ View and table counts match - security inheritance working')
      } else {
        console.log('⚠️  View and table counts differ - check policies')
      }
    }
    
    // Test 3: Verify only verified mentors are accessible publicly
    console.log('\n3️⃣ Testing verified mentor filtering...')
    
    const { data: allMentors } = await supabase
      .from('mentors_view')
      .select('id, verified')
    
    const publiclyVisible = allMentors.filter(m => m.verified).length
    const total = allMentors.length
    
    console.log(`📊 Total mentors in view: ${total}`)
    console.log(`📊 Verified (publicly visible): ${publiclyVisible}`)
    
    if (publiclyVisible === total) {
      console.log('✅ All mentors in view are verified - good security')
    } else {
      console.log('⚠️  Some unverified mentors in view - check verification process')
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

testMentorsViewSecurity()