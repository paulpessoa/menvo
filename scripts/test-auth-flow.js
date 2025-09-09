#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testAuthFlow() {
  console.log('🔐 Testing authentication flow...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Missing environment variables');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Test 1: Check if we can list users (admin access)
    console.log('🧪 Test 1: Admin access check...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ Admin access failed:', usersError.message);
    } else {
      console.log(`✅ Admin access working (${users.users.length} users found)`);
    }

    // Test 2: Check storage permissions
    console.log('\n🧪 Test 2: Storage access check...');
    
    // Try to list files in profile-photos bucket
    const { data: files, error: filesError } = await supabase.storage
      .from('profile-photos')
      .list('', { limit: 1 });
    
    if (filesError) {
      console.log('❌ Storage access failed:', filesError.message);
    } else {
      console.log('✅ Storage access working');
    }

    // Test 3: Check profiles table access
    console.log('\n🧪 Test 3: Profiles table access...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profilesError) {
      console.log('❌ Profiles table access failed:', profilesError.message);
    } else {
      console.log('✅ Profiles table access working');
    }

    console.log('\n📋 Summary:');
    console.log('- Environment variables: ✅');
    console.log('- Admin access:', usersError ? '❌' : '✅');
    console.log('- Storage access:', filesError ? '❌' : '✅');
    console.log('- Database access:', profilesError ? '❌' : '✅');

    if (!usersError && !filesError && !profilesError) {
      console.log('\n🎉 All checks passed! Upload should work.');
    } else {
      console.log('\n⚠️  Some checks failed. Check Supabase configuration.');
    }

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

testAuthFlow();
