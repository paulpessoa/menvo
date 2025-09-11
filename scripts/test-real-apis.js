// Test the actual API endpoints to ensure they work with mentors_view
const fetch = require('node-fetch')

const baseUrl = 'http://localhost:3000' // Adjust if needed

async function testRealAPIs() {
  console.log('🌐 Testing real API endpoints...\n')
  
  try {
    // Test /api/mentors
    console.log('1️⃣ Testing GET /api/mentors...')
    const mentorsResponse = await fetch(`${baseUrl}/api/mentors`)
    
    if (mentorsResponse.ok) {
      const mentorsData = await mentorsResponse.json()
      console.log(`✅ /api/mentors successful`)
      console.log(`📊 Found ${mentorsData.mentors?.length || 0} mentors`)
      console.log(`📄 Total count: ${mentorsData.totalCount || 0}`)
      
      // Test individual mentor if available
      if (mentorsData.mentors && mentorsData.mentors.length > 0) {
        const mentorId = mentorsData.mentors[0].id
        
        console.log(`\n2️⃣ Testing GET /api/mentors/${mentorId}...`)
        const mentorResponse = await fetch(`${baseUrl}/api/mentors/${mentorId}`)
        
        if (mentorResponse.ok) {
          const mentorData = await mentorResponse.json()
          console.log(`✅ /api/mentors/[id] successful`)
          console.log(`👤 Mentor: ${mentorData.full_name || mentorData.first_name}`)
          console.log(`✅ Verified: ${mentorData.verified}`)
        } else {
          console.log(`❌ /api/mentors/[id] failed: ${mentorResponse.status}`)
        }
      }
      
    } else {
      console.log(`❌ /api/mentors failed: ${mentorsResponse.status}`)
      const errorText = await mentorsResponse.text()
      console.log(`Error: ${errorText}`)
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('⚠️  Local server not running. Skipping API tests.')
      console.log('💡 To test APIs, run: npm run dev')
    } else {
      console.log(`❌ Error testing APIs: ${error.message}`)
    }
  }
}

testRealAPIs()