/**
 * OAuth Health Check API Route
 * 
 * This API endpoint provides OAuth configuration health status
 * for monitoring and debugging purposes.
 */

import { NextRequest } from 'next/server'
import { handleOAuthHealthCheck } from '@/lib/auth/oauth-middleware'

export async function GET(request: NextRequest) {
  return handleOAuthHealthCheck()
}

export async function POST(request: NextRequest) {
  return handleOAuthHealthCheck()
}
