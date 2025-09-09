#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkBuckets() {
  console.log('🪣 Checking Supabase storage buckets...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Missing Supabase environment variables');
    console.log('Required:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL');
    console.log('- SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  console.log('✅ Environment variables found');

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('🔍 Listing storage buckets...');
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.log('❌ Error listing buckets:', error.message);
      return;
    }

    console.log('📋 Available buckets:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.id} (${bucket.public ? 'public' : 'private'})`);
    });

    // Check for required buckets
    const requiredBuckets = ['profile-photos', 'cvs'];
    console.log('\n🎯 Checking required buckets:');
    
    for (const bucketName of requiredBuckets) {
      const bucket = buckets.find(b => b.id === bucketName);
      if (bucket) {
        console.log(`✅ ${bucketName} bucket exists (${bucket.public ? 'public' : 'private'})`);
      } else {
        console.log(`❌ ${bucketName} bucket missing`);
        console.log(`   Create it with: supabase storage create ${bucketName}`);
      }
    }

  } catch (error) {
    console.log('❌ Error connecting to Supabase:', error.message);
  }
}

checkBuckets();
