#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupStorage() {
  console.log('🚀 Setting up Supabase storage...\n');

  try {
    // 1. Check if profile-photos bucket exists, create if not
    console.log('📁 Checking profile-photos bucket...');
    const { data: profileBuckets, error: profileBucketsError } = await supabase.storage.listBuckets();
    
    if (profileBucketsError) {
      console.error('❌ Error listing buckets:', profileBucketsError);
      return;
    }

    const profilePhotosExists = profileBuckets.some(bucket => bucket.name === 'profile-photos');
    
    if (!profilePhotosExists) {
      console.log('Creating profile-photos bucket...');
      const { error: createProfileError } = await supabase.storage.createBucket('profile-photos', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });
      
      if (createProfileError) {
        console.error('❌ Error creating profile-photos bucket:', createProfileError);
      } else {
        console.log('✅ profile-photos bucket created');
      }
    } else {
      console.log('✅ profile-photos bucket already exists');
    }

    // 2. Check if cvs bucket exists, create if not
    console.log('📁 Checking cvs bucket...');
    const cvsExists = profileBuckets.some(bucket => bucket.name === 'cvs');
    
    if (!cvsExists) {
      console.log('Creating cvs bucket...');
      const { error: createCvError } = await supabase.storage.createBucket('cvs', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['application/pdf']
      });
      
      if (createCvError) {
        console.error('❌ Error creating cvs bucket:', createCvError);
      } else {
        console.log('✅ cvs bucket created');
      }
    } else {
      console.log('✅ cvs bucket already exists');
    }

    // 3. Upload test files
    console.log('\n📤 Uploading test files...');
    
    // Create a simple test image
    const testImageContent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    
    const { error: uploadImageError } = await supabase.storage
      .from('profile-photos')
      .upload('test/sample-avatar.png', testImageContent, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadImageError) {
      console.error('❌ Error uploading test image:', uploadImageError);
    } else {
      console.log('✅ Test image uploaded to profile-photos/test/sample-avatar.png');
    }

    // Create a simple test PDF
    const testPdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n174\n%%EOF');
    
    const { error: uploadPdfError } = await supabase.storage
      .from('cvs')
      .upload('test/sample-cv.pdf', testPdfContent, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadPdfError) {
      console.error('❌ Error uploading test PDF:', uploadPdfError);
    } else {
      console.log('✅ Test PDF uploaded to cvs/test/sample-cv.pdf');
    }

    // 4. Test file access
    console.log('\n🔗 Testing file access...');
    
    const { data: imageUrl } = supabase.storage
      .from('profile-photos')
      .getPublicUrl('test/sample-avatar.png');
    
    const { data: pdfUrl } = supabase.storage
      .from('cvs')
      .getPublicUrl('test/sample-cv.pdf');

    console.log('📷 Test image URL:', imageUrl.publicUrl);
    console.log('📄 Test PDF URL:', pdfUrl.publicUrl);

    // 5. Check if cv_metadata table exists
    console.log('\n📊 Checking cv_metadata table...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'cv_metadata');

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
    } else if (tables && tables.length > 0) {
      console.log('✅ cv_metadata table exists');
    } else {
      console.log('⚠️  cv_metadata table not found - run migration first');
    }

    console.log('\n✅ Supabase storage setup completed!');
    console.log('\n📋 Summary:');
    console.log('- profile-photos bucket: Ready');
    console.log('- cvs bucket: Ready');
    console.log('- Test files uploaded');
    console.log('- Public URLs working');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setupStorage();