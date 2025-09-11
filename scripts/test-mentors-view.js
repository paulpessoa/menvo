const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testMentorsView() {
  console.log('🔍 Testing mentors_view...')
  
  try {
    // Test basic query
    const { data, error, count } = await supabase
      .from('mentors_view')
      .select('*', { count: 'exact' })
    
    if (error) {
      console.error('❌ Error querying mentors_view:', error)
      return
    }
    
    console.log(`✅ mentors_view query successful!`)
    console.log(`📊 Found ${count} mentors in view`)
    
    if (data && data.length > 0) {
      console.log('\n📋 Sample mentor data:')
      const sample = data[0]
      console.log(`- ID: ${sample.id}`)
      console.log(`- Name: ${sample.full_name || sample.first_name}`)
      console.log(`- Email: ${sample.email}`)
      console.log(`- Verified: ${sample.verified}`)
      console.log(`- Expertise: ${sample.expertise_areas}`)
      console.log(`- Active Roles: ${sample.active_roles}`)
      console.log(`- Location: ${sample.location}`)
    } else {
      console.log('⚠️  No mentors found in view')
    }
    
    // Test API compatibility fields
    console.log('\n🔧 Testing API compatibility fields...')
    const { data: apiData, error: apiError } = await supabase
      .from('mentors_view')
      .select('id, mentor_skills, inclusion_tags, active_roles, is_available')
      .limit(1)
    
    if (apiError) {
      console.error('❌ Error testing API fields:', apiError)
    } else {
      console.log('✅ API compatibility fields working')
      if (apiData && apiData.length > 0) {
        console.log('- mentor_skills:', apiData[0].mentor_skills)
        console.log('- inclusion_tags:', apiData[0].inclusion_tags)
        console.log('- active_roles:', apiData[0].active_roles)
        console.log('- is_available:', apiData[0].is_available)
      }
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

testMentorsView()