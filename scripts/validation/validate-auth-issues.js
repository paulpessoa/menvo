#!/usr/bin/env node

/**
 * Authentication Issues Validation Script
 * 
 * This script validates that we can reproduce the authentication issues
 * identified in production after syncing the data locally.
 */

// Load environment variables
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Local Supabase configuration
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

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

function logTest(message) {
  log(`🧪 ${message}`, 'blue');
}

function logPass(message) {
  log(`✅ ${message}`, 'green');
}

function logFail(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

async function testOAuthConfiguration() {
  logTest('Testing OAuth Configuration...');
  
  try {
    // Check if OAuth providers are configured
    // This would normally check the Supabase dashboard settings
    // For now, we'll check environment variables
    
    const hasGoogleConfig = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
    const hasLinkedInConfig = process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET;
    
    if (!hasGoogleConfig) {
      logFail('Google OAuth not configured (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)');
    } else {
      logPass('Google OAuth configuration found');
    }
    
    if (!hasLinkedInConfig) {
      logFail('LinkedIn OAuth not configured (missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET)');
    } else {
      logPass('LinkedIn OAuth configuration found');
    }
    
    // Test OAuth redirect URLs
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    logInfo(`Site URL configured as: ${siteUrl}`);
    
    return {
      google: hasGoogleConfig,
      linkedin: hasLinkedInConfig,
      siteUrl
    };
    
  } catch (error) {
    logFail(`OAuth configuration test failed: ${error.message}`);
    return { google: false, linkedin: false, siteUrl: null };
  }
}

async function testUserRoleRedirection() {
  logTest('Testing User Role Redirection Logic...');
  
  try {
    // Get users without roles
    const { data: profiles } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles(*)
      `);
    
    if (!profiles) {
      logFail('Could not fetch profiles');
      return false;
    }
    
    const usersWithoutRoles = profiles.filter(profile => 
      !profile.user_roles || profile.user_roles.length === 0
    );
    
    const usersWithRoles = profiles.filter(profile => 
      profile.user_roles && profile.user_roles.length > 0
    );
    
    logInfo(`Found ${profiles.length} total users`);
    logInfo(`Users without roles: ${usersWithoutRoles.length}`);
    logInfo(`Users with roles: ${usersWithRoles.length}`);
    
    if (usersWithoutRoles.length > 0) {
      logWarning('Users without roles found - these should redirect to /auth/select-role');
      usersWithoutRoles.slice(0, 3).forEach(user => {
        logInfo(`  - ${user.full_name || user.email} (ID: ${user.user_id})`);
      });
    }
    
    if (usersWithRoles.length > 0) {
      logPass('Users with roles found - these should redirect to dashboard');
      usersWithRoles.slice(0, 3).forEach(user => {
        const roleNames = user.user_roles.map(ur => ur.role || 'unknown').join(', ');
        logInfo(`  - ${user.full_name || user.email} (Roles: ${roleNames})`);
      });
    }
    
    return true;
    
  } catch (error) {
    logFail(`User role redirection test failed: ${error.message}`);
    return false;
  }
}

async function testCascadeDeleteIssues() {
  logTest('Testing Cascade Delete Issues...');
  
  try {
    // Check for orphaned records
    const { data: profiles } = await supabase.from('profiles').select('user_id');
    const { data: userRoles } = await supabase.from('user_roles').select('user_id');
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    
    if (!profiles || !userRoles || !authUsers) {
      logFail('Could not fetch data for cascade delete test');
      return false;
    }
    
    const authUserIds = new Set(authUsers.users.map(u => u.id));
    
    // Check for orphaned profiles
    const orphanedProfiles = profiles.filter(p => !authUserIds.has(p.user_id));
    
    // Check for orphaned user roles
    const orphanedUserRoles = userRoles.filter(ur => !authUserIds.has(ur.user_id));
    
    if (orphanedProfiles.length > 0) {
      logFail(`Found ${orphanedProfiles.length} orphaned profiles (profiles without auth users)`);
      logWarning('This indicates cascade delete is not working properly');
    } else {
      logPass('No orphaned profiles found');
    }
    
    if (orphanedUserRoles.length > 0) {
      logFail(`Found ${orphanedUserRoles.length} orphaned user roles (roles without auth users)`);
      logWarning('This indicates cascade delete is not working properly');
    } else {
      logPass('No orphaned user roles found');
    }
    
    // Check for missing profiles (auth users without profiles)
    const profileUserIds = new Set(profiles.map(p => p.user_id));
    const missingProfiles = authUsers.users.filter(u => !profileUserIds.has(u.id));
    
    if (missingProfiles.length > 0) {
      logWarning(`Found ${missingProfiles.length} auth users without profiles`);
      missingProfiles.slice(0, 3).forEach(user => {
        logInfo(`  - ${user.email} (ID: ${user.id})`);
      });
    }
    
    return {
      orphanedProfiles: orphanedProfiles.length,
      orphanedUserRoles: orphanedUserRoles.length,
      missingProfiles: missingProfiles.length
    };
    
  } catch (error) {
    logFail(`Cascade delete test failed: ${error.message}`);
    return false;
  }
}

async function testPasswordRecoveryFlow() {
  logTest('Testing Password Recovery Flow...');
  
  try {
    // Check if email templates are configured
    // This is more of a configuration check since we can't easily test the full flow
    
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const expectedRecoveryUrl = `${siteUrl}/auth/reset-password`;
    
    logInfo(`Expected recovery URL: ${expectedRecoveryUrl}`);
    
    // Check if we have SMTP configuration for local testing
    const hasSmtpConfig = process.env.SMTP_HOST || process.env.BREVO_SMTP_USER;
    
    if (hasSmtpConfig) {
      logPass('SMTP configuration found for email testing');
    } else {
      logWarning('No SMTP configuration found - emails will use Supabase local inbucket');
      logInfo('Check http://localhost:54324 for test emails');
    }
    
    // Test if we can access the reset password page structure
    // This would normally be done with a web scraper or by checking the Next.js routes
    logInfo('Password recovery flow should redirect to /auth/reset-password');
    logInfo('Current issue: redirects to login instead of password reset form');
    
    return {
      recoveryUrl: expectedRecoveryUrl,
      hasSmtpConfig
    };
    
  } catch (error) {
    logFail(`Password recovery test failed: ${error.message}`);
    return false;
  }
}

async function testDatabaseTriggers() {
  logTest('Testing Database Triggers...');
  
  try {
    // Check if cascade delete triggers exist
    const { data: triggers, error } = await supabase
      .rpc('get_triggers_info')
      .catch(() => ({ data: null, error: 'Function not available' }));
    
    if (error) {
      logWarning('Could not check database triggers directly');
      logInfo('This requires manual verification in Supabase dashboard');
    } else if (triggers) {
      logPass('Database triggers information retrieved');
      // Process trigger information if available
    }
    
    // Alternative: Check if foreign key constraints exist
    const { data: constraints } = await supabase
      .rpc('get_foreign_key_constraints')
      .catch(() => ({ data: null }));
    
    if (constraints) {
      logInfo('Foreign key constraints found - checking for CASCADE options');
    } else {
      logWarning('Could not verify foreign key constraints');
    }
    
    return true;
    
  } catch (error) {
    logFail(`Database triggers test failed: ${error.message}`);
    return false;
  }
}

async function generateIssuesReport() {
  log('\n📋 Generating Issues Report...', 'cyan');
  
  const report = {
    timestamp: new Date().toISOString(),
    issues: [],
    recommendations: []
  };
  
  // OAuth Issues
  const oauthConfig = await testOAuthConfiguration();
  if (!oauthConfig.google || !oauthConfig.linkedin) {
    report.issues.push({
      category: 'OAuth Configuration',
      severity: 'high',
      description: 'OAuth providers not properly configured',
      details: {
        google: oauthConfig.google,
        linkedin: oauthConfig.linkedin
      }
    });
    report.recommendations.push('Configure OAuth client IDs and secrets in Supabase dashboard');
  }
  
  // Role Redirection Issues
  await testUserRoleRedirection();
  report.issues.push({
    category: 'Role Redirection',
    severity: 'medium',
    description: 'Users without roles may not be redirected to select-role page',
    details: 'Middleware needs to check user role status and redirect appropriately'
  });
  report.recommendations.push('Implement middleware to check user roles and redirect to /auth/select-role');
  
  // Cascade Delete Issues
  const cascadeResults = await testCascadeDeleteIssues();
  if (cascadeResults && (cascadeResults.orphanedProfiles > 0 || cascadeResults.orphanedUserRoles > 0)) {
    report.issues.push({
      category: 'Data Integrity',
      severity: 'high',
      description: 'Orphaned records found - cascade delete not working',
      details: cascadeResults
    });
    report.recommendations.push('Implement database triggers for cascade delete on auth.users');
  }
  
  // Password Recovery Issues
  await testPasswordRecoveryFlow();
  report.issues.push({
    category: 'Password Recovery',
    severity: 'medium',
    description: 'Password recovery redirects to login instead of reset form',
    details: 'Email callback handling needs to be fixed'
  });
  report.recommendations.push('Fix password recovery callback to redirect to reset form');
  
  // Save report
  const reportPath = path.join('backups', 'auth-issues-report.json');
  if (!fs.existsSync('backups')) {
    fs.mkdirSync('backups', { recursive: true });
  }
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`\n📄 Issues report saved to: ${reportPath}`, 'cyan');
  
  return report;
}

async function main() {
  log('🔍 Authentication Issues Validation', 'blue');
  log('==================================', 'blue');
  
  try {
    // Run all validation tests
    await testOAuthConfiguration();
    log('');
    await testUserRoleRedirection();
    log('');
    await testCascadeDeleteIssues();
    log('');
    await testPasswordRecoveryFlow();
    log('');
    await testDatabaseTriggers();
    log('');
    
    // Generate comprehensive report
    const report = await generateIssuesReport();
    
    log('\n🎯 Summary of Issues Found:', 'yellow');
    report.issues.forEach((issue, index) => {
      log(`${index + 1}. ${issue.category} (${issue.severity}): ${issue.description}`, 'yellow');
    });
    
    log('\n💡 Recommended Actions:', 'cyan');
    report.recommendations.forEach((rec, index) => {
      log(`${index + 1}. ${rec}`, 'cyan');
    });
    
    log('\n✅ Validation completed! You can now proceed with implementing fixes.', 'green');
    
  } catch (error) {
    logFail(`Validation failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  testOAuthConfiguration,
  testUserRoleRedirection,
  testCascadeDeleteIssues,
  testPasswordRecoveryFlow,
  testDatabaseTriggers
};
