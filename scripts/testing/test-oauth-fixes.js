#!/usr/bin/env node

/**
 * OAuth Fixes Test Script
 * 
 * This script tests the OAuth provider fixes to ensure
 * Google and LinkedIn authentication work correctly.
 */

// Load environment variables
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Colors for console output
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

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  log('❌ Missing Supabase configuration', 'red');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Test OAuth provider configuration
 */
function testOAuthConfig(provider) {
  log(`🧪 Testing ${provider.toUpperCase()} configuration...`, 'blue');
  
  const envVars = {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET
    }
  };
  
  const config = envVars[provider];
  const errors = [];
  const warnings = [];
  
  if (!config.clientId) {
    errors.push(`${provider.toUpperCase()}_CLIENT_ID is missing`);
  } else {
    log(`  ✅ Client ID configured`, 'green');
  }
  
  if (!config.clientSecret) {
    errors.push(`${provider.toUpperCase()}_CLIENT_SECRET is missing`);
  } else {
    log(`  ✅ Client Secret configured`, 'green');
  }
  
  // Provider-specific validations
  if (provider === 'google' && config.clientId && !config.clientId.includes('.apps.googleusercontent.com')) {
    warnings.push('Google Client ID format may be incorrect');
  }
  
  if (provider === 'linkedin' && config.clientSecret && !config.clientSecret.startsWith('WPL_AP1.')) {
    warnings.push('LinkedIn Client Secret format may be incorrect');
  }
  
  if (errors.length > 0) {
    errors.forEach(error => log(`  ❌ ${error}`, 'red'));
  }
  
  if (warnings.length > 0) {
    warnings.forEach(warning => log(`  ⚠️  ${warning}`, 'yellow'));
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Test OAuth provider URL generation
 */
async function testOAuthProvider(provider) {
  log(`🔄 Testing ${provider.toUpperCase()} OAuth URL generation...`, 'blue');
  
  try {
    const providerName = provider === 'linkedin' ? 'linkedin_oidc' : provider;
    const redirectTo = 'http://localhost:3000/auth/callback?test=true';
    
    const options = {
      redirectTo
    };
    
    // Add provider-specific options
    if (provider === 'google') {
      options.queryParams = {
        access_type: 'offline',
        prompt: 'consent'
      };
    } else if (provider === 'linkedin') {
      options.scopes = 'openid profile email';
      options.queryParams = {
        prompt: 'consent'
      };
    }
    
    log(`  Provider: ${providerName}`, 'cyan');
    log(`  Redirect: ${redirectTo}`, 'cyan');
    log(`  Options: ${JSON.stringify(options, null, 4)}`, 'cyan');
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: providerName,
      options
    });
    
    if (error) {
      log(`  ❌ Error: ${error.message}`, 'red');
      return { success: false, error: error.message };
    }
    
    if (data.url) {
      log(`  ✅ OAuth URL generated successfully`, 'green');
      log(`  🔗 URL: ${data.url}`, 'cyan');
      
      // Validate URL structure
      try {
        const url = new URL(data.url);
        log(`  📍 Host: ${url.host}`, 'cyan');
        log(`  📋 Search params: ${url.search}`, 'cyan');
        
        return { success: true, url: data.url };
      } catch (urlError) {
        log(`  ⚠️  Invalid URL format: ${urlError.message}`, 'yellow');
        return { success: false, error: 'Invalid URL format' };
      }
    } else {
      log(`  ❌ No URL returned`, 'red');
      return { success: false, error: 'No URL returned' };
    }
    
  } catch (error) {
    log(`  ❌ Unexpected error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

/**
 * Test API endpoints
 */
async function testOAuthAPI(provider) {
  log(`🌐 Testing ${provider.toUpperCase()} API endpoint...`, 'blue');
  
  try {
    const response = await fetch(`http://localhost:3000/api/auth/${provider}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      log(`  ✅ API endpoint working`, 'green');
      log(`  🔗 URL: ${data.url}`, 'cyan');
      return { success: true, data };
    } else {
      log(`  ❌ API error: ${data.error}`, 'red');
      return { success: false, error: data.error };
    }
    
  } catch (error) {
    log(`  ❌ API request failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

/**
 * Main test function
 */
async function runOAuthTests() {
  log('🧪 OAuth Provider Fixes Test Suite', 'blue');
  log('==================================', 'blue');
  
  const providers = ['google', 'linkedin'];
  const results = {};
  
  for (const provider of providers) {
    log(`\n📋 Testing ${provider.toUpperCase()}`, 'yellow');
    log('─'.repeat(30), 'yellow');
    
    // Test configuration
    const configResult = testOAuthConfig(provider);
    results[provider] = { config: configResult };
    
    if (configResult.isValid) {
      // Test OAuth URL generation
      const oauthResult = await testOAuthProvider(provider);
      results[provider].oauth = oauthResult;
      
      // Test API endpoint (only if Next.js is running)
      log(`\n🔄 Checking if Next.js server is running...`, 'blue');
      try {
        const healthCheck = await fetch('http://localhost:3000/api/health').catch(() => null);
        if (healthCheck) {
          const apiResult = await testOAuthAPI(provider);
          results[provider].api = apiResult;
        } else {
          log(`  ⚠️  Next.js server not running, skipping API test`, 'yellow');
          log(`  💡 Run 'npm run dev' to test API endpoints`, 'cyan');
        }
      } catch (error) {
        log(`  ⚠️  Could not test API endpoint: ${error.message}`, 'yellow');
      }
    } else {
      log(`  ⏭️  Skipping OAuth tests due to configuration errors`, 'yellow');
    }
  }
  
  // Summary
  log(`\n📊 Test Results Summary`, 'blue');
  log('======================', 'blue');
  
  providers.forEach(provider => {
    const result = results[provider];
    const configStatus = result.config.isValid ? '✅' : '❌';
    const oauthStatus = result.oauth?.success ? '✅' : result.oauth ? '❌' : '⏭️';
    const apiStatus = result.api?.success ? '✅' : result.api ? '❌' : '⏭️';
    
    log(`${provider.toUpperCase()}:`, 'yellow');
    log(`  Config: ${configStatus}`, result.config.isValid ? 'green' : 'red');
    log(`  OAuth:  ${oauthStatus}`, result.oauth?.success ? 'green' : result.oauth ? 'red' : 'yellow');
    log(`  API:    ${apiStatus}`, result.api?.success ? 'green' : result.api ? 'red' : 'yellow');
  });
  
  // Recommendations
  log(`\n💡 Recommendations`, 'cyan');
  log('==================', 'cyan');
  
  const hasErrors = providers.some(p => !results[p].config.isValid || (results[p].oauth && !results[p].oauth.success));
  
  if (hasErrors) {
    log('❌ Some OAuth providers have issues:', 'red');
    
    providers.forEach(provider => {
      const result = results[provider];
      if (!result.config.isValid) {
        log(`  - Fix ${provider.toUpperCase()} configuration in environment variables`, 'red');
      }
      if (result.oauth && !result.oauth.success) {
        log(`  - Check ${provider.toUpperCase()} OAuth setup in Supabase dashboard`, 'red');
      }
    });
    
    log('\n🔧 Next steps:', 'yellow');
    log('1. Update environment variables with correct OAuth credentials', 'yellow');
    log('2. Verify OAuth app configuration in provider dashboards', 'yellow');
    log('3. Check redirect URIs match between app and provider settings', 'yellow');
    log('4. Run this test again after fixes', 'yellow');
    
  } else {
    log('✅ All configured OAuth providers are working correctly!', 'green');
    log('🎉 You can now test OAuth login in your application', 'green');
  }
  
  return results;
}

// Run tests
if (require.main === module) {
  runOAuthTests().catch(error => {
    log(`❌ Test suite failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  testOAuthConfig,
  testOAuthProvider,
  testOAuthAPI,
  runOAuthTests
};
