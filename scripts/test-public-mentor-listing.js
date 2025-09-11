const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testPublicMentorListing() {
  console.log('🧪 Testing public mentor listing functionality...\n')
  
  try {
    // Test 1: Test the exact query used in the mentors page
    console.log('1️⃣ Testing mentors page query (profiles table)...')
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        avatar_url,
        bio,
        job_title,
        company,
        city,
        state,
        country,
        languages,
        mentorship_topics,
        inclusive_tags,
        expertise_areas,
        session_price_usd,
        availability_status,
        average_rating,
        total_reviews,
        total_sessions,
        experience_years,
        slug,
        user_roles!inner(
          roles!inner(name)
        )
      `)
      .eq('verified', true)
      .eq('user_roles.roles.name', 'mentor')
      .order('average_rating', { ascending: false })
      .order('total_sessions', { ascending: false })

    if (profilesError) {
      console.log(`❌ Profiles query error: ${profilesError.message}`)
    } else {
      console.log(`✅ Profiles query successful`)
      console.log(`📊 Found ${profilesData.length} verified mentors`)
      
      if (profilesData.length > 0) {
        const sample = profilesData[0]
        console.log(`📋 Sample mentor: ${sample.full_name}`)
        console.log(`   - Job: ${sample.job_title || 'N/A'}`)
        console.log(`   - Company: ${sample.company || 'N/A'}`)
        console.log(`   - Location: ${[sample.city, sample.state, sample.country].filter(Boolean).join(', ') || 'N/A'}`)
        console.log(`   - Topics: ${sample.mentorship_topics?.slice(0, 3).join(', ') || 'N/A'}`)
        console.log(`   - Rating: ${sample.average_rating || 0} (${sample.total_reviews || 0} reviews)`)
      }
    }

    // Test 2: Test mentors_view for comparison
    console.log('\n2️⃣ Testing mentors_view query...')
    const { data: viewData, error: viewError } = await supabase
      .from('mentors_view')
      .select('*')
      .order('rating', { ascending: false })
      .order('sessions', { ascending: false })

    if (viewError) {
      console.log(`❌ View query error: ${viewError.message}`)
    } else {
      console.log(`✅ View query successful`)
      console.log(`📊 Found ${viewData.length} mentors in view`)
      
      if (viewData.length > 0) {
        const sample = viewData[0]
        console.log(`📋 Sample mentor: ${sample.full_name}`)
        console.log(`   - Job: ${sample.current_position || 'N/A'}`)
        console.log(`   - Company: ${sample.current_company || 'N/A'}`)
        console.log(`   - Location: ${sample.location || 'N/A'}`)
        console.log(`   - Skills: ${sample.mentor_skills?.slice(0, 3).join(', ') || 'N/A'}`)
        console.log(`   - Rating: ${sample.rating || 0} (${sample.reviews || 0} reviews)`)
      }
    }

    // Test 3: Test filtering capabilities
    console.log('\n3️⃣ Testing filter capabilities...')
    
    // Test search functionality
    const { data: searchData, error: searchError } = await supabase
      .from('mentors_view')
      .select('id, full_name, mentor_skills')
      .or('full_name.ilike.%Silva%,mentor_skills.cs.{JavaScript}')

    if (searchError) {
      console.log(`❌ Search filter error: ${searchError.message}`)
    } else {
      console.log(`✅ Search filter working - found ${searchData.length} results`)
    }

    // Test availability filter
    const { data: availableData, error: availableError } = await supabase
      .from('mentors_view')
      .select('id, full_name, is_available')
      .eq('is_available', true)

    if (availableError) {
      console.log(`❌ Availability filter error: ${availableError.message}`)
    } else {
      console.log(`✅ Availability filter working - ${availableData.length} available mentors`)
    }

    // Test 4: Test individual mentor profile access
    console.log('\n4️⃣ Testing individual mentor profile access...')
    if (viewData && viewData.length > 0) {
      const mentorId = viewData[0].id
      const { data: mentorDetail, error: mentorError } = await supabase
        .from('mentors_view')
        .select('*')
        .eq('id', mentorId)
        .single()

      if (mentorError) {
        console.log(`❌ Individual mentor query error: ${mentorError.message}`)
      } else {
        console.log(`✅ Individual mentor query successful`)
        console.log(`📋 Mentor details: ${mentorDetail.full_name}`)
      }
    }

    // Test 5: Compare data consistency
    console.log('\n5️⃣ Testing data consistency...')
    if (profilesData && viewData) {
      const profileIds = new Set(profilesData.map(m => m.id))
      const viewIds = new Set(viewData.map(m => m.id))
      
      const onlyInProfiles = [...profileIds].filter(id => !viewIds.has(id))
      const onlyInView = [...viewIds].filter(id => !profileIds.has(id))
      
      if (onlyInProfiles.length === 0 && onlyInView.length === 0) {
        console.log('✅ Data consistency perfect - same mentors in both queries')
      } else {
        console.log(`⚠️  Data inconsistency detected:`)
        console.log(`   - Only in profiles: ${onlyInProfiles.length}`)
        console.log(`   - Only in view: ${onlyInView.length}`)
      }
    }

    console.log('\n🎉 Public mentor listing tests completed!')
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

testPublicMentorListing()