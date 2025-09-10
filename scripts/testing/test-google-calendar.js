/**
 * Test script for Google Calendar integration
 * Run with: node scripts/test-google-calendar.js
 */

// Test script for Google Calendar integration
// This script checks environment variables and provides setup instructions

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
  
  console.log('📝 To test the Google Calendar integration:');
  console.log('   1. Make sure you have the required environment variables set');
  console.log('   2. Start your Next.js development server: npm run dev');
  console.log('   3. Visit: http://localhost:3000/test/calendar');
  console.log('   4. Follow the instructions on that page');
  
  try {
    // Test by making HTTP request to the test endpoint
    console.log('\n🔄 Testing API endpoint...');
    
    const response = await fetch('http://localhost:3000/api/calendar/test', {
      method: 'POST',
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ API endpoint is working!');
      console.log('📋 Response:', result);
    } else {
      const error = await response.json();
      console.log('❌ API endpoint error:', error);
    }
    
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