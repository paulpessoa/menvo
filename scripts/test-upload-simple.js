#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing upload functionality (simplified)...\n');

// Check if upload endpoints exist
const endpoints = [
  'app/api/upload/profile-photo/route.ts',
  'app/api/upload/cv/route.ts'
];

endpoints.forEach(endpoint => {
  const fullPath = path.join(process.cwd(), endpoint);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${endpoint} exists`);
    
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Check for essential components
    if (content.includes('export async function POST')) {
      console.log(`  ✅ POST handler found`);
    } else {
      console.log(`  ❌ POST handler missing`);
    }
    
    if (content.includes('supabaseAdmin')) {
      console.log(`  ✅ Supabase admin client found`);
    } else {
      console.log(`  ❌ Supabase admin client missing`);
    }
    
    if (content.includes('authorization')) {
      console.log(`  ✅ Authorization check found`);
    } else {
      console.log(`  ❌ Authorization check missing`);
    }
    
  } else {
    console.log(`❌ ${endpoint} not found`);
  }
  console.log('');
});

// Check hooks
const hookPath = path.join(process.cwd(), 'hooks/useFileUpload.ts');
if (fs.existsSync(hookPath)) {
  console.log('✅ File upload hook exists');
  
  const hookContent = fs.readFileSync(hookPath, 'utf8');
  
  if (hookContent.includes('useImageUpload')) {
    console.log('  ✅ Image upload hook found');
  }
  
  if (hookContent.includes('usePDFUpload')) {
    console.log('  ✅ PDF upload hook found');
  }
  
} else {
  console.log('❌ File upload hook not found');
}

console.log('\n📋 Next steps for testing:');
console.log('1. Start the development server: npm run dev');
console.log('2. Navigate to /profile page');
console.log('3. Try uploading a small image file');
console.log('4. Check browser console for detailed error messages');
console.log('5. Check server logs for upload progress');
