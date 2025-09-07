#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugAuth() {
  console.log('🔍 Debugging authentication...\n');

  try {
    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('Current session:', session ? 'EXISTS' : 'NULL');
    if (session) {
      console.log('User ID:', session.user?.id);
      console.log('Token expires at:', new Date(session.expires_at * 1000));
      console.log('Token valid:', new Date() < new Date(session.expires_at * 1000));
    }
    
    if (sessionError) {
      console.log('Session error:', sessionError);
    }

    // Try to refresh session
    console.log('\n🔄 Attempting to refresh session...');
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.log('❌ Refresh error:', refreshError);
    } else {
      console.log('✅ Session refreshed successfully');
      console.log('New token expires at:', new Date(refreshData.session.expires_at * 1000));
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugAuth();