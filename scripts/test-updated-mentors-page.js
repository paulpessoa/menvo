const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testUpdatedMentorsPage() {
  console.log('🧪 Testing updated mentors page functionality...\n')
  
  try {
    // Test the new mentors page query
    console.log('1️⃣ Testing new mentors page query (mentors_view)...')
    const { data, error } = await supabase
      .from('mentors_view')
      .select(`
        id,
        full_name,
        avatar_url,
        bio,
        current_position,
        current_company,
        city,
        state,
        country,
        languages,
        mentorship_topics,
        inclusion_tags,
        expertise_areas,
        session_price_usd,
        availability_status,
        rating,
        reviews,
        sessions,
        experience_years,
        slug
      `)
      .order('rating', { ascending: false })
      .order('sessions', { ascending: false })

    if (error) {
      console.log(`❌ New query error: ${error.message}`)
      return
    }

    console.log(`✅ New query successful`)
    console.log(`📊 Found ${data.length} mentors`)
    
    if (data.length > 0) {
      console.log('\n📋 Sample mentors:')
      data.slice(0, 3).forEach((mentor, index) => {
        console.log(`${index + 1}. ${mentor.full_name}`)
        console.log(`   - Job: ${mentor.current_position || 'N/A'}`)
        console.log(`   - Company: ${mentor.current_company || 'N/A'}`)
        console.log(`   - Location: ${[mentor.city, mentor.state, mentor.country].filter(Boolean).join(', ') || 'N/A'}`)
        console.log(`   - Topics: ${mentor.mentorship_topics?.slice(0, 2).join(', ') || 'N/A'}`)
        console.log(`   - Skills: ${mentor.expertise_areas?.slice(0, 2).join(', ') || 'N/A'}`)
        console.log(`   - Rating: ${mentor.rating || 0} (${mentor.reviews || 0} reviews)`)
        console.log(`   - Sessions: ${mentor.sessions || 0}`)
        console.log(`   - Available: ${mentor.availability_status}`)
        console.log('')
      })
    }

    // Test filter options query
    console.log('2️⃣ Testing filter options query...')
    const { data: filterData, error: filterError } = await supabase
      .from('mentors_view')
      .select(`
        country,
        state,
        city,
        languages,
        mentorship_topics,
        inclusion_tags
      `)

    if (filterError) {
      console.log(`❌ Filter options error: ${filterError.message}`)
    } else {
      console.log(`✅ Filter options query successful`)
      
      // Extract unique values for filters
      const countries = new Set()
      const states = new Set()
      const cities = new Set()
      const languages = new Set()
      const topics = new Set()
      const inclusiveTags = new Set()

      filterData.forEach(mentor => {
        if (mentor.country) countries.add(mentor.country)
        if (mentor.state) states.add(mentor.state)
        if (mentor.city) cities.add(mentor.city)
        mentor.languages?.forEach(lang => languages.add(lang))
        mentor.mentorship_topics?.forEach(topic => topics.add(topic))
        mentor.inclusion_tags?.forEach(tag => inclusiveTags.add(tag))
      })

      console.log(`📊 Filter options available:`)
      console.log(`   - Countries: ${countries.size} (${Array.from(countries).slice(0, 3).join(', ')}${countries.size > 3 ? '...' : ''})`)
      console.log(`   - States: ${states.size}`)
      console.log(`   - Cities: ${cities.size}`)
      console.log(`   - Languages: ${languages.size} (${Array.from(languages).join(', ')})`)
      console.log(`   - Topics: ${topics.size} (${Array.from(topics).slice(0, 3).join(', ')}${topics.size > 3 ? '...' : ''})`)
      console.log(`   - Inclusion Tags: ${inclusiveTags.size}`)
    }

    // Test search functionality
    console.log('\n3️⃣ Testing search functionality...')
    const { data: searchResults, error: searchError } = await supabase
      .from('mentors_view')
      .select('id, full_name, expertise_areas, mentorship_topics')
      .or('full_name.ilike.%Ana%,expertise_areas.cs.{JavaScript},mentorship_topics.cs.{Frontend}')

    if (searchError) {
      console.log(`❌ Search error: ${searchError.message}`)
    } else {
      console.log(`✅ Search working - found ${searchResults.length} results`)
      searchResults.forEach(result => {
        console.log(`   - ${result.full_name}`)
      })
    }

    // Test availability filter
    console.log('\n4️⃣ Testing availability filter...')
    const { data: availableResults, error: availableError } = await supabase
      .from('mentors_view')
      .select('id, full_name, availability_status, is_available')
      .eq('is_available', true)

    if (availableError) {
      console.log(`❌ Availability filter error: ${availableError.message}`)
    } else {
      console.log(`✅ Availability filter working - ${availableResults.length} available mentors`)
    }

    console.log('\n🎉 Updated mentors page tests completed successfully!')
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

testUpdatedMentorsPage()