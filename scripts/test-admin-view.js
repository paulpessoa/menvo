const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAdminView() {
  console.log('👨‍💼 Testing mentors_admin_view...\n')
  
  try {
    // Test mentors_admin_view (should show all mentors)
    const { data: adminData, error: adminError } = await supabase
      .from('mentors_admin_view')
      .select('id, verified, email')
    
    if (adminError) {
      console.log(`❌ Admin view error: ${adminError.message}`)
    } else {
      const verifiedCount = adminData.filter(m => m.verified).length
      const unverifiedCount = adminData.filter(m => !m.verified).length
      
      console.log(`✅ Admin view access successful`)
      console.log(`📊 Total mentors: ${adminData.length}`)
      console.log(`📊 Verified mentors: ${verifiedCount}`)
      console.log(`📊 Unverified mentors: ${unverifiedCount}`)
    }
    
    // Compare with public view
    const { data: publicData } = await supabase
      .from('mentors_view')
      .select('id, verified')
    
    console.log(`\n📊 Comparison:`)
    console.log(`- Public view (mentors_view): ${publicData.length} mentors`)
    console.log(`- Admin view (mentors_admin_view): ${adminData.length} mentors`)
    
    if (adminData.length >= publicData.length) {
      console.log('✅ Admin view shows same or more mentors than public view')
    } else {
      console.log('❌ Admin view shows fewer mentors than public view - something is wrong')
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

testAdminView()