/**
 * OAuth Diagnostics API Route
 * 
 * This API endpoint provides comprehensive OAuth diagnostics
 * for debugging authentication issues.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Import our OAuth fixes
async function getOAuthProvidersStatus() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing')
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const providers: ('google' | 'linkedin' | 'github')[] = ['google', 'linkedin', 'github']
  const status: Record<string, any> = {}
  
  for (const provider of providers) {
    const validation = validateOAuthProvider(provider)
    
    status[provider] = {
      configured: validation.isValid,
      available: validation.isValid, // We'll test this separately
      error: validation.errors.length > 0 ? validation.errors.join(', ') : undefined,
      warnings: validation.warnings
    }
  }
  
  return status
}

function validateOAuthProvider(provider: 'google' | 'linkedin' | 'github'): {
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

export async function GET(request: NextRequest) {
  try {
    const providersStatus = await getOAuthProvidersStatus()
    
    const diagnostics = {
      providers: providersStatus,
      environment: {
        isDevelopment: process.env.NODE_ENV === 'development',
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      },
      lastUpdated: new Date().toISOString()
    }
    
    return NextResponse.json(diagnostics)
    
  } catch (error: any) {
    console.error('OAuth diagnostics error:', error)
    
    return NextResponse.json({
      error: 'Failed to run OAuth diagnostics',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Same as GET for now, but could be extended for specific tests
  return GET(request)
}