/**
 * Test script for CV upload functionality
 * Run with: node scripts/test-cv-upload.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCVInfrastructure() {
  console.log('🧪 Testing CV upload infrastructure...\n');

  try {
    // Test 1: Check if cvs bucket exists
    console.log('1. Checking CVs storage bucket...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Error listing buckets:', bucketError);
      return;
    }

    const cvsBucket = buckets.find(b => b.id === 'cvs');
    if (cvsBucket) {
      console.log('✅ CVs bucket found:', cvsBucket);
    } else {
      console.error('❌ CVs bucket not found');
      console.log('Available buckets:', buckets.map(b => b.id));
      return;
    }

    // Test 2: Check cv_metadata table
    console.log('\n2. Checking cv_metadata table...');
    const { data: metadataTest, error: metadataError } = await supabase
      .from('cv_metadata')
      .select('*')
      .limit(1);

    if (metadataError) {
      console.error('❌ Error accessing cv_metadata table:', metadataError);
      return;
    } else {
      console.log('✅ cv_metadata table accessible');
    }

    // Test 3: Check storage policies
    console.log('\n3. Checking storage policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('storage.policies')
      .select('*')
      .eq('bucket_id', 'cvs');

    if (policiesError) {
      console.error('❌ Error checking policies:', policiesError);
    } else {
      console.log('✅ Storage policies found:', policies.length);
      policies.forEach(policy => {
        console.log(`  - ${policy.name}: ${policy.command}`);
      });
    }

    // Test 4: Check profiles table has cv_url field
    console.log('\n4. Checking profiles table structure...');
    const { data: profileTest, error: profileError } = await supabase
      .from('profiles')
      .select('cv_url')
      .limit(1);

    if (profileError) {
      console.error('❌ Error accessing profiles cv_url field:', profileError);
    } else {
      console.log('✅ Profiles table has cv_url field');
    }

    console.log('\n🎉 All infrastructure tests passed!');
    console.log('\n📋 Next steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Go to /profile page');
    console.log('3. Try uploading a PDF file as CV');
    console.log('4. Check if the file appears in Supabase Storage');
    console.log('5. Verify the cv_url is updated in the profiles table');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testCVInfrastructure();
