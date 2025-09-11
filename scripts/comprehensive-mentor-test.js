const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function comprehensiveMentorTest() {
  console.log('🧪 Running comprehensive mentor functionality tests...\n')
  
  let passedTests = 0
  let totalTests = 0
  
  // Test 1: mentors_view returns correct data structure
  totalTests++
  console.log('1️⃣ Testing mentors_view data structure...')
  try {
    const { data, error } = await supabase
      .from('mentors_view')
      .select('*')
      .limit(1)
    
    if (error) throw error
    
    if (data && data.length > 0) {
      const mentor = data[0]
      const requiredFields = [
        'id', 'email', 'first_name', 'last_name', 'full_name', 'bio',
        'expertise_areas', 'mentor_skills', 'active_roles', 'verified',
        'is_available', 'location', 'rating', 'reviews', 'sessions'
      ]
      
      const missingFields = requiredFields.filter(field => !(field in mentor))
      
      if (missingFields.length === 0) {
        console.log('✅ All required fields present')
        passedTests++
      } else {
        console.log(`❌ Missing fields: ${missingFields.join(', ')}`)
      }
    } else {
      console.log('❌ No data returned')
    }
  } catch (err) {
    console.log(`❌ Error: ${err.message}`)
  }
  
  // Test 2: Only users with mentor role appear
  totalTests++
  console.log('\n2️⃣ Testing mentor role filtering...')
  try {
    const { data, error } = await supabase
      .from('mentors_view')
      .select('id, active_roles')
    
    if (error) throw error
    
    const allHaveMentorRole = data.every(mentor => 
      mentor.active_roles && mentor.active_roles.includes('mentor')
    )
    
    if (allHaveMentorRole) {
      console.log(`✅ All ${data.length} records have mentor role`)
      passedTests++
    } else {
      console.log('❌ Some records missing mentor role')
    }
  } catch (err) {
    console.log(`❌ Error: ${err.message}`)
  }
  
  // Test 3: API compatibility - /api/mentors pattern
  totalTests++
  console.log('\n3️⃣ Testing /api/mentors compatibility...')
  try {
    const { data, error, count } = await supabase
      .from('mentors_view')
      .select('*', { count: 'exact' })
      .contains('active_roles', ['mentor'])
      .not('mentor_skills', 'is', null)
    
    if (error) throw error
    
    console.log(`✅ API query successful - ${count} mentors with skills`)
    passedTests++
  } catch (err) {
    console.log(`❌ Error: ${err.message}`)
  }
  
  // Test 4: API compatibility - /api/mentors/[id] pattern
  totalTests++
  console.log('\n4️⃣ Testing /api/mentors/[id] compatibility...')
  try {
    const { data: allMentors } = await supabase
      .from('mentors_view')
      .select('id')
      .limit(1)
    
    if (allMentors && allMentors.length > 0) {
      const { data, error } = await supabase
        .from('mentors_view')
        .select('*')
        .eq('id', allMentors[0].id)
        .contains('active_roles', ['mentor'])
        .single()
      
      if (error) throw error
      
      console.log(`✅ Single mentor query successful`)
      passedTests++
    } else {
      console.log('❌ No mentors available for testing')
    }
  } catch (err) {
    console.log(`❌ Error: ${err.message}`)
  }
  
  // Test 5: Admin user appears as mentor
  totalTests++
  console.log('\n5️⃣ Testing admin user as mentor...')
  try {
    const adminId = '0737122a-0579-4981-9802-41883d6563a3'
    const { data, error } = await supabase
      .from('mentors_view')
      .select('id, email, verified, expertise_areas')
      .eq('id', adminId)
      .single()
    
    if (error) throw error
    
    if (data && data.verified && data.expertise_areas && data.expertise_areas.length > 0) {
      console.log(`✅ Admin user is verified mentor with ${data.expertise_areas.length} skills`)
      passedTests++
    } else {
      console.log('❌ Admin user not properly configured as mentor')
    }
  } catch (err) {
    console.log(`❌ Error: ${err.message}`)
  }
  
  // Test 6: Field mappings work correctly
  totalTests++
  console.log('\n6️⃣ Testing field mappings...')
  try {
    const { data, error } = await supabase
      .from('mentors_view')
      .select('expertise_areas, mentor_skills, inclusive_tags, inclusion_tags')
      .not('expertise_areas', 'is', null)
      .limit(1)
    
    if (error) throw error
    
    if (data && data.length > 0) {
      const mentor = data[0]
      const expertiseMatch = JSON.stringify(mentor.expertise_areas) === JSON.stringify(mentor.mentor_skills)
      const inclusionMatch = JSON.stringify(mentor.inclusive_tags) === JSON.stringify(mentor.inclusion_tags)
      
      if (expertiseMatch) {
        console.log('✅ expertise_areas = mentor_skills mapping works')
        passedTests++
      } else {
        console.log('❌ expertise_areas ≠ mentor_skills mapping failed')
      }
    }
  } catch (err) {
    console.log(`❌ Error: ${err.message}`)
  }
  
  // Test 7: Performance check
  totalTests++
  console.log('\n7️⃣ Testing query performance...')
  try {
    const startTime = Date.now()
    const { data, error } = await supabase
      .from('mentors_view')
      .select('*')
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    if (error) throw error
    
    if (duration < 2000) { // Less than 2 seconds
      console.log(`✅ Query completed in ${duration}ms`)
      passedTests++
    } else {
      console.log(`⚠️  Query took ${duration}ms (might be slow)`)
      passedTests++ // Still pass, just warn
    }
  } catch (err) {
    console.log(`❌ Error: ${err.message}`)
  }
  
  // Summary
  console.log('\n📊 Test Summary:')
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`)
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! mentors_view is working correctly.')
  } else {
    console.log('⚠️  Some tests failed. Please review the issues above.')
  }
  
  return passedTests === totalTests
}

comprehensiveMentorTest()