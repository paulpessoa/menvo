/**
 * OAuth Configuration Validator Tests
 */

import {
  validateGoogleOAuth,
  validateLinkedInOAuth,
  validateGitHubOAuth,
  validateAllOAuthProviders,
  getOAuthEnvironment,
  isOAuthReadyForProduction,
  generateOAuthReport
} from '../oauth-config-validator'

// Mock environment variables
const originalEnv = process.env

beforeEach(() => {
  jest.resetModules()
  process.env = { ...originalEnv }
})

afterAll(() => {
  process.env = originalEnv
})

describe('OAuth Configuration Validator', () => {
  describe('getOAuthEnvironment', () => {
    it('should detect development environment', () => {
      process.env.NODE_ENV = 'development'
      process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'

      const env = getOAuthEnvironment()

      expect(env.isDevelopment).toBe(true)
      expect(env.isProduction).toBe(false)
      expect(env.siteUrl).toBe('http://localhost:3000')
      expect(env.expectedRedirectUris).toContain('http://localhost:3000/auth/callback')
    })

    it('should detect production environment', () => {
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'

      const env = getOAuthEnvironment()

      expect(env.isDevelopment).toBe(false)
      expect(env.isProduction).toBe(true)
      expect(env.siteUrl).toBe('https://example.com')
    })

    it('should use default site URL when not provided', () => {
      delete process.env.NEXT_PUBLIC_SITE_URL

      const env = getOAuthEnvironment()

      expect(env.siteUrl).toBe('http://localhost:3000')
    })
  })

  describe('validateGoogleOAuth', () => {
    it('should pass validation with correct configuration', () => {
      process.env.GOOGLE_CLIENT_ID = '123456789.apps.googleusercontent.com'
      process.env.GOOGLE_CLIENT_SECRET = 'GOCSPX-test-secret'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'

      const result = validateGoogleOAuth()

      expect(result.isValid).toBe(true)
      expect(result.provider).toBe('google')
      expect(result.errors).toHaveLength(0)
      expect(result.config?.enabled).toBe(true)
    })

    it('should fail validation with missing client ID', () => {
      delete process.env.GOOGLE_CLIENT_ID
      process.env.GOOGLE_CLIENT_SECRET = 'GOCSPX-test-secret'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'

      const result = validateGoogleOAuth()

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('GOOGLE_CLIENT_ID environment variable is missing')
    })

    it('should fail validation with invalid client ID format', () => {
      process.env.GOOGLE_CLIENT_ID = 'invalid-client-id'
      process.env.GOOGLE_CLIENT_SECRET = 'GOCSPX-test-secret'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'

      const result = validateGoogleOAuth()

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('GOOGLE_CLIENT_ID format appears invalid (should end with .apps.googleusercontent.com)')
    })

    it('should warn about invalid client secret format', () => {
      process.env.GOOGLE_CLIENT_ID = '123456789.apps.googleusercontent.com'
      process.env.GOOGLE_CLIENT_SECRET = 'invalid-secret'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'

      const result = validateGoogleOAuth()

      expect(result.isValid).toBe(true) // Still valid, just a warning
      expect(result.warnings).toContain('GOOGLE_CLIENT_SECRET format may be invalid (should start with GOCSPX-)')
    })

    it('should fail validation with missing Supabase URL', () => {
      process.env.GOOGLE_CLIENT_ID = '123456789.apps.googleusercontent.com'
      process.env.GOOGLE_CLIENT_SECRET = 'GOCSPX-test-secret'
      delete process.env.NEXT_PUBLIC_SUPABASE_URL

      const result = validateGoogleOAuth()

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('NEXT_PUBLIC_SUPABASE_URL is required for OAuth')
    })
  })

  describe('validateLinkedInOAuth', () => {
    it('should pass validation with correct configuration', () => {
      process.env.LINKEDIN_CLIENT_ID = 'test-client-id'
      process.env.LINKEDIN_CLIENT_SECRET = 'WPL_AP1.test-secret'

      const result = validateLinkedInOAuth()

      expect(result.isValid).toBe(true)
      expect(result.provider).toBe('linkedin')
      expect(result.errors).toHaveLength(0)
      expect(result.config?.scopes).toContain('openid')
    })

    it('should fail validation with missing credentials', () => {
      delete process.env.LINKEDIN_CLIENT_ID
      delete process.env.LINKEDIN_CLIENT_SECRET

      const result = validateLinkedInOAuth()

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('LINKEDIN_CLIENT_ID environment variable is missing')
      expect(result.errors).toContain('LINKEDIN_CLIENT_SECRET environment variable is missing')
    })

    it('should warn about short client ID', () => {
      process.env.LINKEDIN_CLIENT_ID = 'short'
      process.env.LINKEDIN_CLIENT_SECRET = 'WPL_AP1.test-secret'

      const result = validateLinkedInOAuth()

      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('LINKEDIN_CLIENT_ID appears too short')
    })

    it('should warn about invalid secret format', () => {
      process.env.LINKEDIN_CLIENT_ID = 'test-client-id'
      process.env.LINKEDIN_CLIENT_SECRET = 'invalid-secret'

      const result = validateLinkedInOAuth()

      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('LINKEDIN_CLIENT_SECRET format may be invalid (should start with WPL_AP1.)')
    })
  })

  describe('validateGitHubOAuth', () => {
    it('should pass validation with correct configuration', () => {
      process.env.GITHUB_CLIENT_ID = 'Ov23li1234567890'
      process.env.GITHUB_CLIENT_SECRET = '1234567890123456789012345678901234567890' // 40 chars

      const result = validateGitHubOAuth()

      expect(result.isValid).toBe(true)
      expect(result.provider).toBe('github')
      expect(result.errors).toHaveLength(0)
      expect(result.config?.scopes).toContain('user:email')
    })

    it('should fail validation with missing credentials', () => {
      delete process.env.GITHUB_CLIENT_ID
      delete process.env.GITHUB_CLIENT_SECRET

      const result = validateGitHubOAuth()

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('GITHUB_CLIENT_ID environment variable is missing')
      expect(result.errors).toContain('GITHUB_CLIENT_SECRET environment variable is missing')
    })

    it('should warn about invalid client ID format', () => {
      process.env.GITHUB_CLIENT_ID = 'invalid-format'
      process.env.GITHUB_CLIENT_SECRET = '1234567890123456789012345678901234567890'

      const result = validateGitHubOAuth()

      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('GITHUB_CLIENT_ID format may be invalid')
    })

    it('should warn about invalid secret length', () => {
      process.env.GITHUB_CLIENT_ID = 'Ov23li1234567890'
      process.env.GITHUB_CLIENT_SECRET = 'too-short'

      const result = validateGitHubOAuth()

      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('GITHUB_CLIENT_SECRET should be 40 characters long')
    })
  })

  describe('validateAllOAuthProviders', () => {
    it('should validate all providers', () => {
      // Set up valid configuration for all providers
      process.env.GOOGLE_CLIENT_ID = '123456789.apps.googleusercontent.com'
      process.env.GOOGLE_CLIENT_SECRET = 'GOCSPX-test-secret'
      process.env.LINKEDIN_CLIENT_ID = 'test-client-id'
      process.env.LINKEDIN_CLIENT_SECRET = 'WPL_AP1.test-secret'
      process.env.GITHUB_CLIENT_ID = 'Ov23li1234567890'
      process.env.GITHUB_CLIENT_SECRET = '1234567890123456789012345678901234567890'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'

      const results = validateAllOAuthProviders()

      expect(results).toHaveLength(3)
      expect(results.map(r => r.provider)).toEqual(['google', 'linkedin', 'github'])
      expect(results.every(r => r.isValid)).toBe(true)
    })
  })

  describe('isOAuthReadyForProduction', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    })

    it('should return true when properly configured for production', () => {
      process.env.GOOGLE_CLIENT_ID = '123456789.apps.googleusercontent.com'
      process.env.GOOGLE_CLIENT_SECRET = 'GOCSPX-test-secret'

      const result = isOAuthReadyForProduction()

      expect(result).toBe(true)
    })

    it('should return false when no providers are configured', () => {
      delete process.env.GOOGLE_CLIENT_ID
      delete process.env.LINKEDIN_CLIENT_ID
      delete process.env.GITHUB_CLIENT_ID

      const result = isOAuthReadyForProduction()

      expect(result).toBe(false)
    })

    it('should return false when using localhost redirect URIs', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
      process.env.GOOGLE_CLIENT_ID = '123456789.apps.googleusercontent.com'
      process.env.GOOGLE_CLIENT_SECRET = 'GOCSPX-test-secret'

      const result = isOAuthReadyForProduction()

      expect(result).toBe(false)
    })
  })

  describe('generateOAuthReport', () => {
    it('should generate a comprehensive report', () => {
      process.env.GOOGLE_CLIENT_ID = '123456789.apps.googleusercontent.com'
      process.env.GOOGLE_CLIENT_SECRET = 'GOCSPX-test-secret'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'

      const report = generateOAuthReport()

      expect(report).toContain('# OAuth Configuration Report')
      expect(report).toContain('## Summary')
      expect(report).toContain('## Provider Details')
      expect(report).toContain('## Expected Redirect URIs')
      expect(report).toContain('✅ GOOGLE')
    })

    it('should include action items when configuration is invalid', () => {
      delete process.env.GOOGLE_CLIENT_ID
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'

      const report = generateOAuthReport()

      expect(report).toContain('## Action Items')
      expect(report).toContain('GOOGLE_CLIENT_ID environment variable is missing')
    })
  })
})
