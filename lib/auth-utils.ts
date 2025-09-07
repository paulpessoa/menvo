/**
 * Authentication utilities for API calls
 */

import { logger } from '@/lib/logger';

export interface AuthResult {
  success: boolean;
  token?: string;
  error?: string;
}

/**
 * Gets a valid authentication token, attempting refresh if needed
 */
export async function getValidAuthToken(): Promise<AuthResult> {
  try {
    const { supabase } = await import('@/lib/supabase');
    
    // First, try to get current session
    let { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    logger.info('Getting auth token', 'AuthUtils', { 
      hasSession: !!session,
      hasToken: !!session?.access_token,
      sessionError: sessionError?.message
    });
    
    // If we have a valid session, return it
    if (session?.access_token) {
      // Check if token is not expired (with 5 minute buffer)
      const expiresAt = session.expires_at * 1000;
      const now = Date.now();
      const buffer = 5 * 60 * 1000; // 5 minutes
      
      if (expiresAt > now + buffer) {
        logger.info('Using existing valid token', 'AuthUtils');
        return { success: true, token: session.access_token };
      }
      
      logger.info('Token expires soon, refreshing', 'AuthUtils', {
        expiresAt: new Date(expiresAt),
        now: new Date(now)
      });
    }
    
    // Try to refresh the session
    logger.info('Attempting to refresh session', 'AuthUtils');
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      logger.error('Session refresh failed', 'AuthUtils', { 
        error: refreshError.message 
      });
      return { 
        success: false, 
        error: 'Não foi possível renovar a sessão. Faça login novamente.' 
      };
    }
    
    if (!refreshData.session?.access_token) {
      logger.error('No token after refresh', 'AuthUtils');
      return { 
        success: false, 
        error: 'Sessão inválida. Faça login novamente.' 
      };
    }
    
    logger.info('Session refreshed successfully', 'AuthUtils');
    return { 
      success: true, 
      token: refreshData.session.access_token 
    };
    
  } catch (error) {
    logger.error('Auth token error', 'AuthUtils', { error });
    return { 
      success: false, 
      error: 'Erro de autenticação. Tente novamente.' 
    };
  }
}

/**
 * Makes an authenticated API request with automatic token refresh
 */
export async function makeAuthenticatedRequest(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const authResult = await getValidAuthToken();
  
  if (!authResult.success) {
    throw new Error(authResult.error || 'Falha na autenticação');
  }
  
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${authResult.token}`
  };
  
  return fetch(url, {
    ...options,
    headers
  });
}