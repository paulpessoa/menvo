/**
 * OAuth Configuration Validator
 * 
 * This module validates OAuth provider configurations and provides
 * detailed error reporting for configuration issues.
 */

export interface OAuthConfig {
  provider: 'google' | 'linkedin' | 'github'
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes?: string[]
  enabled: boolean
}

export interface ConfigValidation {
  isValid: boolean
  provider: string
  errors: string[]
  warnings: string[]
  config?: Partial<OAuthConfig>
}

export interface OAuthEnvironment {
  isDevelopment: boolean
  isProduction: boolean
  siteUrl: string
  expectedRedirectUris: string[]
}

/**
 * Get OAuth environment information
 */
export function getOAuthEnvironment(): OAuthEnvironment {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  const expectedRedirectUris = [
    `${siteUrl}/auth/callback`,
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
  ].filter(Boolean)

  return {
    isDevelopment,
    isProduction,
    siteUrl,
    expectedRedirectUris
  }
}

/**
 * Validate Google OAuth configuration
 */
export function validateGoogleOAuth(): ConfigValidation {
  const errors: string[] = []
  const warnings: string[] = []
  
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const env = getOAuthEnvironment()

  // Check required environment variables
  if (!clientId) {
    errors.push('GOOGLE_CLIENT_ID environment variable is missing')
  } else if (!clientId.includes('.apps.googleusercontent.com')) {
    errors.push('GOOGLE_CLIENT_ID format appears invalid (should end with .apps.googleusercontent.com)')
  }

  if (!clientSecret) {
    errors.push('GOOGLE_CLIENT_SECRET environment variable is missing')
  } else if (!clientSecret.startsWith('GOCSPX-')) {
    warnings.push('GOOGLE_CLIENT_SECRET format may be invalid (should start with GOCSPX-)')
  }

  // Validate redirect URIs
  if (env.isDevelopment) {
    const hasLocalRedirect = env.expectedRedirectUris.some(uri => 
      uri.includes('localhost') || uri.includes('127.0.0.1')
    )
    if (!hasLocalRedirect) {
      warnings.push('No localhost redirect URI configured for development')
    }
  }

  if (env.isProduction) {
    const hasProductionRedirect = env.expectedRedirectUris.some(uri => 
      !uri.includes('localhost') && !uri.includes('127.0.0.1')
    )
    if (!hasProductionRedirect) {
      errors.push('No production redirect URI configured')
    }
  }

  // Check Supabase OAuth configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required for OAuth')
  }

  const config: Partial<OAuthConfig> = {
    provider: 'google',
    clientId: clientId || '',
    clientSecret: clientSecret ? '[REDACTED]' : '',
    redirectUri: env.expectedRedirectUris[0] || '',
    enabled: !!(clientId && clientSecret)
  }

  return {
    isValid: errors.length === 0,
    provider: 'google',
    errors,
    warnings,
    config
  }
}

/**
 * Validate LinkedIn OAuth configuration
 */
export function validateLinkedInOAuth(): ConfigValidation {
  const errors: string[] = []
  const warnings: string[] = []
  
  const clientId = process.env.LINKEDIN_CLIENT_ID
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
  const env = getOAuthEnvironment()

  // Check required environment variables
  if (!clientId) {
    errors.push('LINKEDIN_CLIENT_ID environment variable is missing')
  } else if (clientId.length < 10) {
    warnings.push('LINKEDIN_CLIENT_ID appears too short')
  }

  if (!clientSecret) {
    errors.push('LINKEDIN_CLIENT_SECRET environment variable is missing')
  } else if (!clientSecret.startsWith('WPL_AP1.')) {
    warnings.push('LINKEDIN_CLIENT_SECRET format may be invalid (should start with WPL_AP1.)')
  }

  // LinkedIn specific validations
  if (clientId && clientSecret) {
    // LinkedIn requires specific scopes
    const requiredScopes = ['openid', 'profile', 'email']
    warnings.push(`Ensure LinkedIn app has required scopes: ${requiredScopes.join(', ')}`)
  }

  const config: Partial<OAuthConfig> = {
    provider: 'linkedin',
    clientId: clientId || '',
    clientSecret: clientSecret ? '[REDACTED]' : '',
    redirectUri: env.expectedRedirectUris[0] || '',
    scopes: ['openid', 'profile', 'email'],
    enabled: !!(clientId && clientSecret)
  }

  return {
    isValid: errors.length === 0,
    provider: 'linkedin',
    errors,
    warnings,
    config
  }
}

/**
 * Validate GitHub OAuth configuration
 */
export function validateGitHubOAuth(): ConfigValidation {
  const errors: string[] = []
  const warnings: string[] = []
  
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  const env = getOAuthEnvironment()

  // Check required environment variables
  if (!clientId) {
    errors.push('GITHUB_CLIENT_ID environment variable is missing')
  } else if (!clientId.startsWith('Ov23li') && !clientId.startsWith('Iv1.')) {
    warnings.push('GITHUB_CLIENT_ID format may be invalid')
  }

  if (!clientSecret) {
    errors.push('GITHUB_CLIENT_SECRET environment variable is missing')
  } else if (clientSecret.length !== 40) {
    warnings.push('GITHUB_CLIENT_SECRET should be 40 characters long')
  }

  const config: Partial<OAuthConfig> = {
    provider: 'github',
    clientId: clientId || '',
    clientSecret: clientSecret ? '[REDACTED]' : '',
    redirectUri: env.expectedRedirectUris[0] || '',
    scopes: ['user:email'],
    enabled: !!(clientId && clientSecret)
  }

  return {
    isValid: errors.length === 0,
    provider: 'github',
    errors,
    warnings,
    config
  }
}

/**
 * Validate all OAuth providers
 */
export function validateAllOAuthProviders(): ConfigValidation[] {
  return [
    validateGoogleOAuth(),
    validateLinkedInOAuth(),
    validateGitHubOAuth()
  ]
}

/**
 * Get OAuth configuration summary
 */
export function getOAuthConfigSummary() {
  const validations = validateAllOAuthProviders()
  const env = getOAuthEnvironment()
  
  const summary = {
    environment: env,
    providers: validations,
    totalErrors: validations.reduce((sum, v) => sum + v.errors.length, 0),
    totalWarnings: validations.reduce((sum, v) => sum + v.warnings.length, 0),
    enabledProviders: validations.filter(v => v.config?.enabled).length,
    validProviders: validations.filter(v => v.isValid).length
  }

  return summary
}

/**
 * Check if OAuth is properly configured for production
 */
export function isOAuthReadyForProduction(): boolean {
  const validations = validateAllOAuthProviders()
  const env = getOAuthEnvironment()
  
  // At least one provider must be valid
  const hasValidProvider = validations.some(v => v.isValid && v.config?.enabled)
  
  // Must have production redirect URIs
  const hasProductionRedirect = env.expectedRedirectUris.some(uri => 
    !uri.includes('localhost') && !uri.includes('127.0.0.1')
  )
  
  // No critical errors
  const hasCriticalErrors = validations.some(v => v.errors.length > 0)
  
  return hasValidProvider && hasProductionRedirect && !hasCriticalErrors
}

/**
 * Generate OAuth configuration report
 */
export function generateOAuthReport(): string {
  const summary = getOAuthConfigSummary()
  const isReady = isOAuthReadyForProduction()
  
  let report = '# OAuth Configuration Report\n\n'
  
  report += `**Environment**: ${summary.environment.isDevelopment ? 'Development' : 'Production'}\n`
  report += `**Site URL**: ${summary.environment.siteUrl}\n`
  report += `**Ready for Production**: ${isReady ? '✅ Yes' : '❌ No'}\n\n`
  
  report += `## Summary\n`
  report += `- **Enabled Providers**: ${summary.enabledProviders}/3\n`
  report += `- **Valid Providers**: ${summary.validProviders}/3\n`
  report += `- **Total Errors**: ${summary.totalErrors}\n`
  report += `- **Total Warnings**: ${summary.totalWarnings}\n\n`
  
  report += `## Provider Details\n\n`
  
  summary.providers.forEach(provider => {
    const status = provider.isValid ? '✅' : '❌'
    const enabled = provider.config?.enabled ? '(Enabled)' : '(Disabled)'
    
    report += `### ${status} ${provider.provider.toUpperCase()} ${enabled}\n`
    
    if (provider.errors.length > 0) {
      report += `**Errors:**\n`
      provider.errors.forEach(error => {
        report += `- ❌ ${error}\n`
      })
    }
    
    if (provider.warnings.length > 0) {
      report += `**Warnings:**\n`
      provider.warnings.forEach(warning => {
        report += `- ⚠️ ${warning}\n`
      })
    }
    
    if (provider.config) {
      report += `**Configuration:**\n`
      report += `- Client ID: ${provider.config.clientId ? '✅ Set' : '❌ Missing'}\n`
      report += `- Client Secret: ${provider.config.clientSecret ? '✅ Set' : '❌ Missing'}\n`
      report += `- Redirect URI: ${provider.config.redirectUri}\n`
      if (provider.config.scopes) {
        report += `- Scopes: ${provider.config.scopes.join(', ')}\n`
      }
    }
    
    report += '\n'
  })
  
  report += `## Expected Redirect URIs\n`
  summary.environment.expectedRedirectUris.forEach(uri => {
    report += `- ${uri}\n`
  })
  
  if (!isReady) {
    report += `\n## Action Items\n`
    summary.providers.forEach(provider => {
      if (provider.errors.length > 0) {
        report += `### Fix ${provider.provider.toUpperCase()} Issues:\n`
        provider.errors.forEach(error => {
          report += `- ${error}\n`
        })
      }
    })
  }
  
  return report
}

/**
 * Log OAuth configuration status to console
 */
export function logOAuthStatus(): void {
  const summary = getOAuthConfigSummary()
  
  console.log('🔐 OAuth Configuration Status')
  console.log('============================')
  
  summary.providers.forEach(provider => {
    const status = provider.isValid ? '✅' : '❌'
    const enabled = provider.config?.enabled ? '(Enabled)' : '(Disabled)'
    
    console.log(`${status} ${provider.provider.toUpperCase()} ${enabled}`)
    
    if (provider.errors.length > 0) {
      provider.errors.forEach(error => {
        console.log(`  ❌ ${error}`)
      })
    }
    
    if (provider.warnings.length > 0) {
      provider.warnings.forEach(warning => {
        console.log(`  ⚠️  ${warning}`)
      })
    }
  })
  
  console.log(`\n📊 Summary: ${summary.validProviders}/${summary.providers.length} providers valid`)
  
  if (summary.totalErrors > 0) {
    console.log(`❌ ${summary.totalErrors} errors need to be fixed`)
  }
  
  if (summary.totalWarnings > 0) {
    console.log(`⚠️  ${summary.totalWarnings} warnings to review`)
  }
}