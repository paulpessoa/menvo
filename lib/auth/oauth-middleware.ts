/**
 * OAuth Middleware
 * 
 * This module provides middleware functions for OAuth validation
 * and error handling in Next.js applications.
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateAllOAuthProviders } from './oauth-config-validator'

/**
 * OAuth configuration validation middleware
 */
export function oauthValidationMiddleware(request: NextRequest): NextResponse | null {
  // Only validate OAuth on auth-related routes
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth/') ||
                     request.nextUrl.pathname.startsWith('/api/auth/')
  
  if (!isAuthRoute) {
    return null // Continue to next middleware
  }
  
  // Skip validation for certain routes that don't need OAuth
  const skipRoutes = [
    '/auth/login',
    '/auth/register', 
    '/auth/reset-password',
    '/api/auth/callback' // This is handled by Supabase
  ]
  
  const shouldSkip = skipRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  if (shouldSkip) {
    return null
  }
  
  try {
    const validations = validateAllOAuthProviders()
    const hasErrors = validations.some(v => v.errors.length > 0)
    
    if (hasErrors && process.env.NODE_ENV === 'production') {
      // In production, redirect to error page if OAuth is misconfigured
      const errorUrl = new URL('/auth/error', request.url)
      errorUrl.searchParams.set('error', 'oauth_configuration')
      return NextResponse.redirect(errorUrl)
    }
    
    // In development, log warnings but continue
    if (hasErrors || validations.some(v => v.warnings.length > 0)) {
      console.warn('⚠️  OAuth configuration issues detected on route:', request.nextUrl.pathname)
    }
    
  } catch (error) {
    console.error('OAuth validation middleware error:', error)
    
    if (process.env.NODE_ENV === 'production') {
      const errorUrl = new URL('/auth/error', request.url)
      errorUrl.searchParams.set('error', 'oauth_validation_failed')
      return NextResponse.redirect(errorUrl)
    }
  }
  
  return null // Continue to next middleware
}

/**
 * OAuth provider availability check
 */
export function checkOAuthProviderAvailability(provider: string): {
  available: boolean
  error?: string
} {
  try {
    const validations = validateAllOAuthProviders()
    const providerValidation = validations.find(v => v.provider === provider)
    
    if (!providerValidation) {
      return {
        available: false,
        error: `Unknown OAuth provider: ${provider}`
      }
    }
    
    if (!providerValidation.config?.enabled) {
      return {
        available: false,
        error: `OAuth provider ${provider} is not configured`
      }
    }
    
    if (!providerValidation.isValid) {
      return {
        available: false,
        error: `OAuth provider ${provider} has configuration errors: ${providerValidation.errors.join(', ')}`
      }
    }
    
    return { available: true }
    
  } catch (error) {
    return {
      available: false,
      error: `Failed to check OAuth provider availability: ${error.message}`
    }
  }
}

/**
 * Generate OAuth error response
 */
export function createOAuthErrorResponse(
  error: string,
  provider?: string,
  details?: any
): NextResponse {
  const errorData = {
    error,
    provider,
    details,
    timestamp: new Date().toISOString()
  }
  
  return NextResponse.json(errorData, { 
    status: 400,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

/**
 * OAuth health check endpoint handler
 */
export function handleOAuthHealthCheck(): NextResponse {
  try {
    const validations = validateAllOAuthProviders()
    const hasErrors = validations.some(v => v.errors.length > 0)
    const hasWarnings = validations.some(v => v.warnings.length > 0)
    
    const status = hasErrors ? 'error' : hasWarnings ? 'warning' : 'healthy'
    const statusCode = hasErrors ? 500 : hasWarnings ? 200 : 200
    
    const response = {
      status,
      timestamp: new Date().toISOString(),
      providers: validations.map(v => ({
        provider: v.provider,
        enabled: v.config?.enabled || false,
        valid: v.isValid,
        errors: v.errors,
        warnings: v.warnings
      })),
      summary: {
        total: validations.length,
        enabled: validations.filter(v => v.config?.enabled).length,
        valid: validations.filter(v => v.isValid).length,
        errors: validations.reduce((sum, v) => sum + v.errors.length, 0),
        warnings: validations.reduce((sum, v) => sum + v.warnings.length, 0)
      }
    }
    
    return NextResponse.json(response, { status: statusCode })
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: 'Failed to check OAuth health',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}