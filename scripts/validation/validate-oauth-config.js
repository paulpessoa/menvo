#!/usr/bin/env node

/**
 * OAuth Configuration Validation CLI
 * 
 * This script validates OAuth provider configurations and generates
 * detailed reports for debugging configuration issues.
 */

// Load environment variables
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');

// Import validation functions (we'll simulate them since we can't import TS directly)
// In a real scenario, this would be compiled or use ts-node

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

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

/**
 * Get OAuth environment information
 */
function getOAuthEnvironment() {
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  const isProduction = process.env.NODE_ENV === 'production';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  const expectedRedirectUris = [
    `${siteUrl.replace(/\/$/, '')}/auth/callback`,
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
  ].filter(Boolean);

  return {
    isDevelopment,
    isProduction,
    siteUrl,
    expectedRedirectUris
  };
}

/**
 * Validate Google OAuth configuration
 */
function validateGoogleOAuth() {
  const errors = [];
  const warnings = [];
  
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const env = getOAuthEnvironment();

  // Check required environment variables
  if (!clientId) {
    errors.push('GOOGLE_CLIENT_ID environment variable is missing');
  } else if (!clientId.includes('.apps.googleusercontent.com')) {
    errors.push('GOOGLE_CLIENT_ID format appears invalid (should end with .apps.googleusercontent.com)');
  }

  if (!clientSecret) {
    errors.push('GOOGLE_CLIENT_SECRET environment variable is missing');
  } else if (!clientSecret.startsWith('GOCSPX-')) {
    warnings.push('GOOGLE_CLIENT_SECRET format may be invalid (should start with GOCSPX-)');
  }

  // Validate redirect URIs for development
  if (env.isDevelopment) {
    const hasLocalRedirect = env.expectedRedirectUris.some(uri => 
      uri.includes('localhost') || uri.includes('127.0.0.1')
    );
    if (!hasLocalRedirect) {
      warnings.push('No localhost redirect URI configured for development');
    }
  }

  // Check Supabase OAuth configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required for OAuth');
  }

  const config = {
    provider: 'google',
    clientId: clientId || '',
    clientSecret: clientSecret ? '[REDACTED]' : '',
    redirectUri: env.expectedRedirectUris[0] || '',
    enabled: !!(clientId && clientSecret)
  };

  return {
    isValid: errors.length === 0,
    provider: 'google',
    errors,
    warnings,
    config
  };
}

/**
 * Validate LinkedIn OAuth configuration
 */
function validateLinkedInOAuth() {
  const errors = [];
  const warnings = [];
  
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const env = getOAuthEnvironment();

  // Check required environment variables
  if (!clientId) {
    errors.push('LINKEDIN_CLIENT_ID environment variable is missing');
  } else if (clientId.length < 10) {
    warnings.push('LINKEDIN_CLIENT_ID appears too short');
  }

  if (!clientSecret) {
    errors.push('LINKEDIN_CLIENT_SECRET environment variable is missing');
  } else if (!clientSecret.startsWith('WPL_AP1.')) {
    warnings.push('LINKEDIN_CLIENT_SECRET format may be invalid (should start with WPL_AP1.)');
  }

  // LinkedIn specific validations
  if (clientId && clientSecret) {
    const requiredScopes = ['openid', 'profile', 'email'];
    warnings.push(`Ensure LinkedIn app has required scopes: ${requiredScopes.join(', ')}`);
  }

  const config = {
    provider: 'linkedin',
    clientId: clientId || '',
    clientSecret: clientSecret ? '[REDACTED]' : '',
    redirectUri: env.expectedRedirectUris[0] || '',
    scopes: ['openid', 'profile', 'email'],
    enabled: !!(clientId && clientSecret)
  };

  return {
    isValid: errors.length === 0,
    provider: 'linkedin',
    errors,
    warnings,
    config
  };
}

/**
 * Validate GitHub OAuth configuration
 */
function validateGitHubOAuth() {
  const errors = [];
  const warnings = [];
  
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const env = getOAuthEnvironment();

  // Check required environment variables
  if (!clientId) {
    errors.push('GITHUB_CLIENT_ID environment variable is missing');
  } else if (!clientId.startsWith('Ov23li') && !clientId.startsWith('Iv1.')) {
    warnings.push('GITHUB_CLIENT_ID format may be invalid');
  }

  if (!clientSecret) {
    errors.push('GITHUB_CLIENT_SECRET environment variable is missing');
  } else if (clientSecret.length !== 40) {
    warnings.push('GITHUB_CLIENT_SECRET should be 40 characters long');
  }

  const config = {
    provider: 'github',
    clientId: clientId || '',
    clientSecret: clientSecret ? '[REDACTED]' : '',
    redirectUri: env.expectedRedirectUris[0] || '',
    scopes: ['user:email'],
    enabled: !!(clientId && clientSecret)
  };

  return {
    isValid: errors.length === 0,
    provider: 'github',
    errors,
    warnings,
    config
  };
}

/**
 * Validate all OAuth providers
 */
function validateAllOAuthProviders() {
  return [
    validateGoogleOAuth(),
    validateLinkedInOAuth(),
    validateGitHubOAuth()
  ];
}

/**
 * Check if OAuth is properly configured for production
 */
function isOAuthReadyForProduction() {
  const validations = validateAllOAuthProviders();
  const env = getOAuthEnvironment();
  
  // At least one provider must be valid
  const hasValidProvider = validations.some(v => v.isValid && v.config.enabled);
  
  // Must have production redirect URIs
  const hasProductionRedirect = env.expectedRedirectUris.some(uri => 
    !uri.includes('localhost') && !uri.includes('127.0.0.1')
  );
  
  // No critical errors
  const hasCriticalErrors = validations.some(v => v.errors.length > 0);
  
  return hasValidProvider && hasProductionRedirect && !hasCriticalErrors;
}

/**
 * Generate OAuth configuration report
 */
function generateOAuthReport() {
  const validations = validateAllOAuthProviders();
  const env = getOAuthEnvironment();
  const isReady = isOAuthReadyForProduction();
  
  const summary = {
    environment: env,
    providers: validations,
    totalErrors: validations.reduce((sum, v) => sum + v.errors.length, 0),
    totalWarnings: validations.reduce((sum, v) => sum + v.warnings.length, 0),
    enabledProviders: validations.filter(v => v.config.enabled).length,
    validProviders: validations.filter(v => v.isValid).length,
    isReady
  };
  
  let report = '# OAuth Configuration Report\n\n';
  
  report += `**Environment**: ${summary.environment.isDevelopment ? 'Development' : 'Production'}\n`;
  report += `**Site URL**: ${summary.environment.siteUrl}\n`;
  report += `**Ready for Production**: ${isReady ? '✅ Yes' : '❌ No'}\n\n`;
  
  report += `## Summary\n`;
  report += `- **Enabled Providers**: ${summary.enabledProviders}/3\n`;
  report += `- **Valid Providers**: ${summary.validProviders}/3\n`;
  report += `- **Total Errors**: ${summary.totalErrors}\n`;
  report += `- **Total Warnings**: ${summary.totalWarnings}\n\n`;
  
  report += `## Provider Details\n\n`;
  
  summary.providers.forEach(provider => {
    const status = provider.isValid ? '✅' : '❌';
    const enabled = provider.config.enabled ? '(Enabled)' : '(Disabled)';
    
    report += `### ${status} ${provider.provider.toUpperCase()} ${enabled}\n`;
    
    if (provider.errors.length > 0) {
      report += `**Errors:**\n`;
      provider.errors.forEach(error => {
        report += `- ❌ ${error}\n`;
      });
    }
    
    if (provider.warnings.length > 0) {
      report += `**Warnings:**\n`;
      provider.warnings.forEach(warning => {
        report += `- ⚠️ ${warning}\n`;
      });
    }
    
    if (provider.config) {
      report += `**Configuration:**\n`;
      report += `- Client ID: ${provider.config.clientId ? '✅ Set' : '❌ Missing'}\n`;
      report += `- Client Secret: ${provider.config.clientSecret ? '✅ Set' : '❌ Missing'}\n`;
      report += `- Redirect URI: ${provider.config.redirectUri}\n`;
      if (provider.config.scopes) {
        report += `- Scopes: ${provider.config.scopes.join(', ')}\n`;
      }
    }
    
    report += '\n';
  });
  
  report += `## Expected Redirect URIs\n`;
  summary.environment.expectedRedirectUris.forEach(uri => {
    report += `- ${uri}\n`;
  });
  
  if (!isReady) {
    report += `\n## Action Items\n`;
    summary.providers.forEach(provider => {
      if (provider.errors.length > 0) {
        report += `### Fix ${provider.provider.toUpperCase()} Issues:\n`;
        provider.errors.forEach(error => {
          report += `- ${error}\n`;
        });
      }
    });
  }
  
  return { report, summary };
}

/**
 * Log OAuth configuration status to console
 */
function logOAuthStatus() {
  const validations = validateAllOAuthProviders();
  const env = getOAuthEnvironment();
  
  log('🔐 OAuth Configuration Status', 'blue');
  log('============================', 'blue');
  
  logInfo(`Environment: ${env.isDevelopment ? 'Development' : 'Production'}`);
  logInfo(`Site URL: ${env.siteUrl}`);
  log('');
  
  validations.forEach(provider => {
    const status = provider.isValid ? '✅' : '❌';
    const enabled = provider.config.enabled ? '(Enabled)' : '(Disabled)';
    
    log(`${status} ${provider.provider.toUpperCase()} ${enabled}`, provider.isValid ? 'green' : 'red');
    
    if (provider.errors.length > 0) {
      provider.errors.forEach(error => {
        logError(`  ${error}`);
      });
    }
    
    if (provider.warnings.length > 0) {
      provider.warnings.forEach(warning => {
        logWarning(`  ${warning}`);
      });
    }
    
    log('');
  });
  
  const summary = {
    totalErrors: validations.reduce((sum, v) => sum + v.errors.length, 0),
    totalWarnings: validations.reduce((sum, v) => sum + v.warnings.length, 0),
    validProviders: validations.filter(v => v.isValid).length,
    enabledProviders: validations.filter(v => v.config.enabled).length
  };
  
  logInfo(`Summary: ${summary.validProviders}/${validations.length} providers valid, ${summary.enabledProviders} enabled`);
  
  if (summary.totalErrors > 0) {
    logError(`${summary.totalErrors} errors need to be fixed`);
  }
  
  if (summary.totalWarnings > 0) {
    logWarning(`${summary.totalWarnings} warnings to review`);
  }
  
  const isReady = isOAuthReadyForProduction();
  if (isReady) {
    logSuccess('OAuth configuration is ready for production!');
  } else {
    logError('OAuth configuration needs fixes before production deployment');
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  
  try {
    switch (command) {
      case 'status':
        logOAuthStatus();
        break;
        
      case 'report':
        const { report, summary } = generateOAuthReport();
        
        // Save report to file
        const reportPath = path.join('backups', 'oauth-config-report.md');
        if (!fs.existsSync('backups')) {
          fs.mkdirSync('backups', { recursive: true });
        }
        fs.writeFileSync(reportPath, report);
        
        logSuccess(`OAuth configuration report saved to: ${reportPath}`);
        
        // Also save JSON summary
        const jsonPath = path.join('backups', 'oauth-config-summary.json');
        fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
        
        logSuccess(`OAuth configuration summary saved to: ${jsonPath}`);
        break;
        
      case 'validate':
        const validations = validateAllOAuthProviders();
        const hasErrors = validations.some(v => v.errors.length > 0);
        
        logOAuthStatus();
        
        if (hasErrors) {
          log('\n❌ Validation failed - configuration errors found', 'red');
          process.exit(1);
        } else {
          log('\n✅ Validation passed - no critical errors found', 'green');
        }
        break;
        
      case 'help':
        log('OAuth Configuration Validator', 'blue');
        log('============================', 'blue');
        log('');
        log('Usage: node scripts/validation/validate-oauth-config.js [command]');
        log('');
        log('Commands:');
        log('  status    Show OAuth configuration status (default)');
        log('  report    Generate detailed configuration report');
        log('  validate  Validate configuration and exit with error code if invalid');
        log('  help      Show this help message');
        break;
        
      default:
        logError(`Unknown command: ${command}`);
        logInfo('Use "help" command to see available options');
        process.exit(1);
    }
    
  } catch (error) {
    logError(`OAuth validation failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  validateGoogleOAuth,
  validateLinkedInOAuth,
  validateGitHubOAuth,
  validateAllOAuthProviders,
  isOAuthReadyForProduction,
  generateOAuthReport,
  logOAuthStatus
};
