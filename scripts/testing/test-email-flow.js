#!/usr/bin/env node

/**
 * Email Flow Test Script
 * 
 * This script tests the email flow in local Supabase environment
 */

// Load environment variables
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Local Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEmailConfiguration() {
  log('📧 Testing Email Configuration', 'blue');
  log('=============================', 'blue');
  
  // Check environment
  log(`Supabase URL: ${supabaseUrl}`, 'cyan');
  
  if (!supabaseUrl || !supabaseUrl.includes('127.0.0.1')) {
    log('❌ Not using local Supabase URL!', 'red');
    log('   Expected: http://127.0.0.1:54321', 'yellow');
    log('   Run: node scripts/switch-supabase-env.js local', 'yellow');
    return false;
  }
  
  log('✅ Using local Supabase URL', 'green');
  
  // Test Supabase connection
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      log(`❌ Supabase connection failed: ${error.message}`, 'red');
      return false;
    }
    
    log('✅ Supabase connection working', 'green');
    
    // Test user creation (this should trigger email)
    const testEmail = `test-${Date.now()}@example.com`;
    log(`\n🧪 Testing user creation with email: ${testEmail}`, 'blue');
    
    const { data: user, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'test123456',
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/callback'
      }
    });
    
    if (signUpError) {
      log(`❌ User creation failed: ${signUpError.message}`, 'red');
      return false;
    }
    
    log('✅ User creation successful', 'green');
    log(`   User ID: ${user.user?.id}`, 'cyan');
    log(`   Email: ${user.user?.email}`, 'cyan');
    log(`   Confirmation sent: ${user.user?.email_confirmed_at ? 'No' : 'Yes'}`, 'cyan');
    
    // Instructions for checking email
    log('\n📬 Check for emails:', 'yellow');
    log('1. Open Mailpit: http://127.0.0.1:54324', 'yellow');
    log('2. Look for emails sent to: ' + testEmail, 'yellow');
    log('3. If no emails appear, check the troubleshooting steps below', 'yellow');
    
    return true;
    
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'red');
    return false;
  }
}

async function checkInbucketStatus() {
  log('\n🔍 Checking Mailpit Status', 'blue');
  
  try {
    // Try Mailpit API first
    const response = await fetch('http://127.0.0.1:54324/api/v1/messages');
    
    if (response.ok) {
      const messages = await response.json();
      log('✅ Mailpit is running and accessible', 'green');
      log(`   Total messages: ${messages.total || 0}`, 'cyan');
      
      if (messages.messages && messages.messages.length > 0) {
        log('   Recent messages:', 'cyan');
        messages.messages.slice(0, 3).forEach(msg => {
          log(`   - To: ${msg.To[0]?.Address} | Subject: ${msg.Subject}`, 'cyan');
        });
      }
      
      return true;
    } else {
      // Fallback: just check if the web interface is accessible
      const webResponse = await fetch('http://127.0.0.1:54324/');
      if (webResponse.ok) {
        log('✅ Mailpit web interface is accessible', 'green');
        log('   API may not be available, but web interface works', 'yellow');
        return true;
      } else {
        log('❌ Mailpit is not responding', 'red');
        return false;
      }
    }
  } catch (error) {
    log('❌ Cannot connect to Mailpit', 'red');
    log('   Make sure Supabase is running: supabase start', 'yellow');
    return false;
  }
}

async function showTroubleshootingSteps() {
  log('\n🔧 Troubleshooting Steps', 'yellow');
  log('=======================', 'yellow');
  
  log('1. Restart Next.js app after changing .env.local:', 'yellow');
  log('   - Stop your dev server (Ctrl+C)', 'cyan');
  log('   - Run: npm run dev', 'cyan');
  
  log('\n2. Verify Supabase is running locally:', 'yellow');
  log('   - Run: supabase status', 'cyan');
  log('   - Should show Inbucket URL: http://127.0.0.1:54324', 'cyan');
  
  log('\n3. Check Supabase configuration:', 'yellow');
  log('   - Run: node scripts/switch-supabase-env.js status', 'cyan');
  log('   - Should show "LOCAL Supabase"', 'cyan');
  
  log('\n4. Test Mailpit directly:', 'yellow');
  log('   - Open: http://127.0.0.1:54324', 'cyan');
  log('   - Should show Mailpit interface', 'cyan');
  
  log('\n5. Check auth configuration in supabase/config.toml:', 'yellow');
  log('   - [auth.email] enable_signup = true', 'cyan');
  log('   - [auth.email] enable_confirmations = false (for testing)', 'cyan');
  log('   - [inbucket] enabled = true', 'cyan');
  
  log('\n6. If still not working, restart Supabase:', 'yellow');
  log('   - Run: supabase stop', 'cyan');
  log('   - Run: supabase start', 'cyan');
}

async function main() {
  try {
    const emailTest = await testEmailConfiguration();
    const inbucketTest = await checkInbucketStatus();
    
    if (emailTest && inbucketTest) {
      log('\n🎉 Email configuration appears to be working!', 'green');
      log('Check http://127.0.0.1:54324 for the test email', 'green');
    } else {
      log('\n❌ Email configuration has issues', 'red');
      await showTroubleshootingSteps();
    }
    
  } catch (error) {
    log(`\n❌ Test failed: ${error.message}`, 'red');
    await showTroubleshootingSteps();
  }
}

main();