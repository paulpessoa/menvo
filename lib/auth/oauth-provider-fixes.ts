/**
 * OAuth Provider Fixes
 * 
 * This module contains fixes for OAuth provider implementations
 * to resolve authentication issues with Google and LinkedIn.
 */

import { createClient } from '@supabase/supabase-js'

export interface OAuthProviderConfig {
  provider: 'google' | 'linkedin' | 'github'
  supabaseProvider: 'google' | 'linkedin_oidc' | 'github'
  scopes?: string[]
  queryParams?: Record<string, string>
}

export interface OAuthOptions {
  redirectTo?: string
  scopes?: string
  queryParams?: Record<string, string>
}

/**
 * Get the correct Supabase provider name
 */
export function getSupabaseProviderName(provider: string): string {
  const providerMap: Record<string, string> = {
    'google': 'google',
    'linkedin': 'linkedin_oidc',
    'github': 'github'
  }
  
  return providerMap[provider] || provider
}

/**
 * Get OAuth configuration for each provider
 */
export function getOAuthConfig(provider: 'google' | 'linkedin' | 'github'): OAuthProviderConfig {
  const configs: Record<string, OAuthProviderConfig> = {
    google: {
      provider: 'google',
      supabaseProvider: 'google',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    },
    linkedin: {
      provider: 'linkedin',
      supabaseProvider: 'linkedin_oidc',
      scopes: ['openid', 'profile', 'email'],
      queryParams: {
        prompt: 'consent'
      }
    },
    github: {
      provider: 'github',
      supabaseProvider: 'github',
      scopes: ['user:email']
    }
  }
  
  return configs[provider]
}

/**
 * Get the correct redirect URI based on environment
 */
export function getRedirectUri(customRedirectTo?: string): string {
  // Use custom redirect if provided
  if (customRedirectTo) {
    return customRedirectTo
  }
  
  // Get base URL
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  return `${baseUrl}/auth/callback`
}

/**
 * Enhanced OAuth sign-in with proper error handling
 */
export async function signInWithOAuthProvider(
  supabase: ReturnType<typeof createClient>,
  provider: 'google' | 'linkedin' | 'github',
  options: OAuthOptions = {}
): Promise<{ data: any; error: any }> {
  try {
    const config = getOAuthConfig(provider)
    const redirectTo = getRedirectUri(options.redirectTo)
    
    console.log(`🔄 Starting OAuth with ${provider}...`)
    console.log(`   Provider: ${config.supabaseProvider}`)
    console.log(`   Redirect: ${redirectTo}`)
    
    // Build OAuth options
    const oauthOptions: any = {
      redirectTo
    }
    
    // Add scopes if specified
    if (config.scopes || options.scopes) {
      const scopes = options.scopes || config.scopes?.join(' ')
      if (scopes) {
        oauthOptions.scopes = scopes
      }
    }
    
    // Add query parameters
    if (config.queryParams || options.queryParams) {
      oauthOptions.queryParams = {
        ...config.queryParams,
        ...options.queryParams
      }
    }
    
    console.log(`   Options:`, JSON.stringify(oauthOptions, null, 2))
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: config.supabaseProvider as any,
      options: oauthOptions
    })
    
    if (error) {
      console.error(`❌ OAuth error for ${provider}:`, error)
      
      // Enhanced error messages
      let enhancedError = error
      if (error.message?.includes('Invalid login credentials')) {
        enhancedError = {
          ...error,
          message: `Falha na autenticação com ${provider}. Verifique suas credenciais.`
        }
      } else if (error.message?.includes('Email not confirmed')) {
        enhancedError = {
          ...error,
          message: 'Email não confirmado. Verifique sua caixa de entrada.'
        }
      } else if (error.message?.includes('Invalid redirect URL')) {
        enhancedError = {
          ...error,
          message: `URL de redirecionamento inválida para ${provider}. Verifique a configuração.`
        }
      }
      
      return { data: null, error: enhancedError }
    }
    
    console.log(`✅ OAuth initiated successfully for ${provider}`)
    console.log(`   Redirect URL: ${data.url}`)
    
    return { data, error: null }
    
  } catch (err: any) {
    console.error(`❌ Unexpected error during ${provider} OAuth:`, err)
    
    return {
      data: null,
      error: {
        message: `Erro inesperado durante autenticação com ${provider}: ${err.message}`,
        details: err
      }
    }
  }
}

/**
 * Validate OAuth provider configuration
 */
export function validateOAuthProvider(provider: 'google' | 'linkedin' | 'github'): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  const envVars = {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET
    }
  }
  
  const config = envVars[provider]
  
  if (!config.clientId) {
    errors.push(`${provider.toUpperCase()}_CLIENT_ID is not configured`)
  }
  
  if (!config.clientSecret) {
    errors.push(`${provider.toUpperCase()}_CLIENT_SECRET is not configured`)
  }
  
  // Provider-specific validations
  if (provider === 'google' && config.clientId && !config.clientId.includes('.apps.googleusercontent.com')) {
    warnings.push('Google Client ID format may be incorrect')
  }
  
  if (provider === 'linkedin' && config.clientSecret && !config.clientSecret.startsWith('WPL_AP1.')) {
    warnings.push('LinkedIn Client Secret format may be incorrect')
  }
  
  if (provider === 'github' && config.clientSecret && config.clientSecret.length !== 40) {
    warnings.push('GitHub Client Secret should be 40 characters long')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Test OAuth provider availability
 */
export async function testOAuthProvider(
  supabase: ReturnType<typeof createClient>,
  provider: 'google' | 'linkedin' | 'github'
): Promise<{
  available: boolean
  error?: string
  redirectUrl?: string
}> {
  try {
    // Validate configuration first
    const validation = validateOAuthProvider(provider)
    if (!validation.isValid) {
      return {
        available: false,
        error: `Configuration errors: ${validation.errors.join(', ')}`
      }
    }
    
    // Try to initiate OAuth (this will return a URL without actually redirecting)
    const result = await signInWithOAuthProvider(supabase, provider, {
      redirectTo: 'http://localhost:3000/auth/callback?test=true'
    })
    
    if (result.error) {
      return {
        available: false,
        error: result.error.message
      }
    }
    
    return {
      available: true,
      redirectUrl: result.data?.url
    }
    
  } catch (error: any) {
    return {
      available: false,
      error: `Test failed: ${error.message}`
    }
  }
}

/**
 * Get OAuth provider status for all providers
 */
export async function getOAuthProvidersStatus(
  supabase: ReturnType<typeof createClient>
): Promise<Record<string, {
  configured: boolean
  available: boolean
  error?: string
  warnings: string[]
}>> {
  const providers: ('google' | 'linkedin' | 'github')[] = ['google', 'linkedin', 'github']
  const status: Record<string, any> = {}
  
  for (const provider of providers) {
    const validation = validateOAuthProvider(provider)
    const test = validation.isValid ? await testOAuthProvider(supabase, provider) : null
    
    status[provider] = {
      configured: validation.isValid,
      available: test?.available || false,
      error: test?.error || (validation.errors.length > 0 ? validation.errors.join(', ') : undefined),
      warnings: validation.warnings
    }
  }
  
  return status
}
