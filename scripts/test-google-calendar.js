/**
 * Test script for Google Calendar integration
 * Run with: node scripts/test-google-calendar.js
 */

const { createCalendarEvent } = require('../lib/google-calendar');

async function testCalendarIntegration() {
  console.log('🧪 Testing Google Calendar integration...');
  
  // Check if environment variables are set
  const requiredEnvVars = [
    'GOOGLE_CALENDAR_CLIENT_ID',
    'GOOGLE_CALENDAR_CLIENT_SECRET',
    'GOOGLE_CALENDAR_REFRESH_TOKEN'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.log('\n📝 Please set these variables in your .env.local file');
    console.log('   You can get these from Google Cloud Console:');
    console.log('   https://console.cloud.google.com/apis/credentials');
    return;
  }
  
  console.log('✅ All required environment variables are set');
  
  try {
    // Create a test event
    const testEvent = {
      summary: 'Test Mentorship Session - API Test',
      description: 'This is a test event created by the Google Calendar integration test script.',
      start: {
        dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
        timeZone: 'America/Sao_Paulo',
      },
      attendees: [
        {
          email: 'test-mentor@example.com',
          displayName: 'Test Mentor',
        },
        {
          email: 'test-mentee@example.com',
          displayName: 'Test Mentee',
        },
      ],
    };
    
    console.log('📅 Creating test calendar event...');
    const result = await createCalendarEvent(testEvent);
    
    console.log('✅ Test event created successfully!');
    console.log('📋 Event details:');
    console.log(`   - Event ID: ${result.id}`);
    console.log(`   - HTML Link: ${result.htmlLink}`);
    console.log(`   - Meet Link: ${result.hangoutLink || 'Not available'}`);
    
    if (result.conferenceData?.entryPoints) {
      const meetEntry = result.conferenceData.entryPoints.find(
        entry => entry.entryPointType === 'video'
      );
      if (meetEntry) {
        console.log(`   - Google Meet: ${meetEntry.uri}`);
      }
    }
    
    console.log('\n🎉 Google Calendar integration is working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing Google Calendar integration:');
    console.error(error.message);
    
    if (error.message.includes('invalid_grant')) {
      console.log('\n💡 This error usually means:');
      console.log('   1. The refresh token has expired');
      console.log('   2. The OAuth consent screen needs to be re-authorized');
      console.log('   3. The client credentials are incorrect');
      console.log('\n🔧 To fix this:');
      console.log('   1. Visit /api/auth/google-calendar/authorize to get a new auth URL');
      console.log('   2. Complete the OAuth flow to get new tokens');
      console.log('   3. Update your GOOGLE_CALENDAR_REFRESH_TOKEN environment variable');
    }
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testCalendarIntegration().catch(console.error);
}

module.exports = { testCalendarIntegration };