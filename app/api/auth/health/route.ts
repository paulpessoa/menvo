/**
 * OAuth Health Check API Route
 * 
 * This API endpoint provides OAuth configuration health status
 * for monitoring and debugging purposes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleOAuthHealthCheck } from '@/lib/auth/oauth-middleware'

// The only consumer (components/auth/oauth-validator.tsx) already gates
// itself to `NODE_ENV === 'development'`, but the route itself had no such
// gate: anyone could hit it directly in production and learn which OAuth
// providers are configured/misconfigured. Mirror the component's gate here
// so the information isn't reachable in production regardless of caller.
function notFoundOutsideDevelopment() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return null
}

export async function GET(request: NextRequest) {
  return notFoundOutsideDevelopment() ?? handleOAuthHealthCheck()
}

export async function POST(request: NextRequest) {
  return notFoundOutsideDevelopment() ?? handleOAuthHealthCheck()
}
