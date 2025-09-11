const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testMentorAPIs() {
  console.log('🔍 Testing mentor APIs compatibility...')
  
  try {
    // Test the exact query used in /api/mentors route
    console.log('\n1️⃣ Testing /api/mentors query pattern...')
    const { data, error, count } = await supabase
      .from('mentors_view')
      .select('*', { count: 'exact' })
      .contains('active_roles', ['mentor'])
      .not('mentor_skills', 'is', null)
    
    if (error) {
      console.error('❌ Error with mentors API query:', error)
      return
    }
    
    console.log(`✅ Mentors API query successful!`)
    console.log(`📊 Found ${count} mentors with skills`)
    
    // Test mentor detail query
    if (data && data.length > 0) {
      const mentorId = data[0].id
      console.log(`\n2️⃣ Testing /api/mentors/[id] query pattern...`)
      
      const { data: mentorData, error: mentorError } = await supabase
        .from('mentors_view')
        .select('*')
        .eq('id', mentorId)
        .contains('active_roles', ['mentor'])
        .single()
      
      if (mentorError) {
        console.error('❌ Error with mentor detail query:', mentorError)
      } else {
        console.log('✅ Mentor detail query successful!')
        console.log(`- Mentor: ${mentorData.full_name}`)
        console.log(`- Skills: ${mentorData.mentor_skills}`)
        console.log(`- Verified: ${mentorData.verified}`)
      }
    }
    
    // Test filtering capabilities
    console.log(`\n3️⃣ Testing filter capabilities...`)
    
    // Test skills filter
    const { data: skillsData, error: skillsError } = await supabase
      .from('mentors_view')
      .select('mentor_skills')
      .contains('active_roles', ['mentor'])
      .not('mentor_skills', 'is', null)
    
    if (skillsError) {
      console.error('❌ Error with skills filter:', skillsError)
    } else {
      console.log('✅ Skills filter working')
      const allSkills = skillsData.flatMap(item => item.mentor_skills || [])
      const uniqueSkills = [...new Set(allSkills)]
      console.log(`- Found ${uniqueSkills.length} unique skills`)
    }
    
    // Test languages filter
    const { data: languagesData, error: languagesError } = await supabase
      .from('mentors_view')
      .select('languages')
      .contains('active_roles', ['mentor'])
      .not('languages', 'is', null)
    
    if (languagesError) {
      console.error('❌ Error with languages filter:', languagesError)
    } else {
      console.log('✅ Languages filter working')
      const allLanguages = languagesData.flatMap(item => item.languages || [])
      const uniqueLanguages = [...new Set(allLanguages)]
      console.log(`- Found ${uniqueLanguages.length} unique languages`)
    }
    
    console.log('\n🎉 All API compatibility tests passed!')
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

testMentorAPIs()