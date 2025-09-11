const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCompleteMentorSystem() {
  console.log('🎯 Testing complete mentor system functionality...\n')
  
  try {
    // Test 1: Public mentor listing
    console.log('1️⃣ Testing public mentor listing...')
    const { data: publicMentors, error: publicError } = await supabase
      .from('mentors_view')
      .select('*')
      .order('rating', { ascending: false })

    if (publicError) {
      console.log(`❌ Public listing error: ${publicError.message}`)
    } else {
      console.log(`✅ Public listing working - ${publicMentors.length} verified mentors`)
      
      // Check data quality
      const mentorsWithJobs = publicMentors.filter(m => m.current_position).length
      const mentorsWithCompanies = publicMentors.filter(m => m.current_company).length
      const mentorsWithBios = publicMentors.filter(m => m.bio).length
      const mentorsWithTopics = publicMentors.filter(m => m.mentorship_topics?.length > 0).length
      const mentorsWithRatings = publicMentors.filter(m => m.rating > 0).length
      
      console.log(`📊 Data quality:`)
      console.log(`   - With job titles: ${mentorsWithJobs}/${publicMentors.length}`)
      console.log(`   - With companies: ${mentorsWithCompanies}/${publicMentors.length}`)
      console.log(`   - With bios: ${mentorsWithBios}/${publicMentors.length}`)
      console.log(`   - With topics: ${mentorsWithTopics}/${publicMentors.length}`)
      console.log(`   - With ratings: ${mentorsWithRatings}/${publicMentors.length}`)
    }

    // Test 2: Admin view (all mentors)
    console.log('\n2️⃣ Testing admin mentor view...')
    const { data: adminMentors, error: adminError } = await supabase
      .from('mentors_admin_view')
      .select('id, full_name, verified, current_position, current_company')

    if (adminError) {
      console.log(`❌ Admin view error: ${adminError.message}`)
    } else {
      const verified = adminMentors.filter(m => m.verified).length
      const unverified = adminMentors.filter(m => !m.verified).length
      
      console.log(`✅ Admin view working - ${adminMentors.length} total mentors`)
      console.log(`📊 Admin stats: ${verified} verified, ${unverified} pending`)
      
      if (unverified > 0) {
        console.log(`📋 Pending mentors:`)
        adminMentors.filter(m => !m.verified).forEach(mentor => {
          console.log(`   - ${mentor.full_name} (${mentor.current_position || 'No title'})`)
        })
      }
    }

    // Test 3: Search and filter functionality
    console.log('\n3️⃣ Testing search and filters...')
    
    // Test search by skill
    const { data: reactMentors, error: reactError } = await supabase
      .from('mentors_view')
      .select('id, full_name, mentor_skills')
      .contains('mentor_skills', ['React'])

    if (reactError) {
      console.log(`❌ React search error: ${reactError.message}`)
    } else {
      console.log(`✅ React mentors: ${reactMentors.length} found`)
    }

    // Test search by topic
    const { data: frontendMentors, error: frontendError } = await supabase
      .from('mentors_view')
      .select('id, full_name, mentorship_topics')
      .contains('mentorship_topics', ['Desenvolvimento Frontend'])

    if (frontendError) {
      console.log(`❌ Frontend search error: ${frontendError.message}`)
    } else {
      console.log(`✅ Frontend mentors: ${frontendMentors.length} found`)
    }

    // Test location filter
    const { data: spMentors, error: spError } = await supabase
      .from('mentors_view')
      .select('id, full_name, state')
      .eq('state', 'SP')

    if (spError) {
      console.log(`❌ SP location error: ${spError.message}`)
    } else {
      console.log(`✅ São Paulo mentors: ${spMentors.length} found`)
    }

    // Test 4: Diversity and inclusion
    console.log('\n4️⃣ Testing diversity and inclusion features...')
    const { data: diversityMentors, error: diversityError } = await supabase
      .from('mentors_view')
      .select('id, full_name, inclusion_tags')
      .not('inclusion_tags', 'is', null)

    if (diversityError) {
      console.log(`❌ Diversity search error: ${diversityError.message}`)
    } else {
      console.log(`✅ Mentors with inclusion tags: ${diversityMentors.length}`)
      
      // Count unique inclusion tags
      const allTags = diversityMentors.flatMap(m => m.inclusion_tags || [])
      const uniqueTags = [...new Set(allTags)]
      console.log(`📊 Inclusion tags available: ${uniqueTags.join(', ')}`)
    }

    // Test 5: Language diversity
    console.log('\n5️⃣ Testing language diversity...')
    const { data: languageData, error: languageError } = await supabase
      .from('mentors_view')
      .select('languages')
      .not('languages', 'is', null)

    if (languageError) {
      console.log(`❌ Language query error: ${languageError.message}`)
    } else {
      const allLanguages = languageData.flatMap(m => m.languages || [])
      const uniqueLanguages = [...new Set(allLanguages)]
      console.log(`✅ Languages available: ${uniqueLanguages.join(', ')}`)
    }

    // Test 6: Experience levels
    console.log('\n6️⃣ Testing experience levels...')
    const { data: experienceData, error: experienceError } = await supabase
      .from('mentors_view')
      .select('full_name, experience_years')
      .not('experience_years', 'is', null)
      .order('experience_years', { ascending: false })

    if (experienceError) {
      console.log(`❌ Experience query error: ${experienceError.message}`)
    } else {
      console.log(`✅ Experience range: ${Math.min(...experienceData.map(m => m.experience_years))} - ${Math.max(...experienceData.map(m => m.experience_years))} years`)
      
      const senior = experienceData.filter(m => m.experience_years >= 8).length
      const mid = experienceData.filter(m => m.experience_years >= 5 && m.experience_years < 8).length
      const junior = experienceData.filter(m => m.experience_years < 5).length
      
      console.log(`📊 Experience levels: ${senior} senior, ${mid} mid-level, ${junior} junior`)
    }

    // Test 7: Availability and scheduling
    console.log('\n7️⃣ Testing availability data...')
    const { data: availabilityData, error: availabilityError } = await supabase
      .from('mentor_availability')
      .select('mentor_id, day_of_week, start_time, end_time')
      .limit(5)

    if (availabilityError) {
      console.log(`❌ Availability query error: ${availabilityError.message}`)
    } else {
      console.log(`✅ Availability slots configured: ${availabilityData.length} sample slots`)
    }

    console.log('\n🎉 Complete mentor system test finished!')
    console.log('\n📊 System Summary:')
    console.log(`   - Total mentors in system: ${adminMentors?.length || 0}`)
    console.log(`   - Public mentors (verified): ${publicMentors?.length || 0}`)
    console.log(`   - Pending verification: ${adminMentors?.filter(m => !m.verified).length || 0}`)
    console.log(`   - Languages supported: ${uniqueLanguages?.length || 0}`)
    console.log(`   - Inclusion tags: ${uniqueTags?.length || 0}`)
    console.log(`   - Cities covered: ${new Set(publicMentors?.map(m => m.city).filter(Boolean)).size || 0}`)
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

testCompleteMentorSystem()