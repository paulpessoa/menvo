#!/usr/bin/env node

const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Load environment variables
require('dotenv').config();

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function testUploadEndpoints() {
  console.log('🧪 Testing upload endpoints...\n');

  // Create test files
  const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  const testPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n174\n%%EOF');

  // Test image upload endpoint
  console.log('📷 Testing image upload endpoint...');
  try {
    const imageForm = new FormData();
    imageForm.append('file', testImageBuffer, {
      filename: 'test-image.png',
      contentType: 'image/png'
    });

    const imageResponse = await fetch(`${baseUrl}/api/upload/profile-photo`, {
      method: 'POST',
      body: imageForm,
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    console.log('Image upload status:', imageResponse.status);
    if (imageResponse.ok) {
      const imageResult = await imageResponse.json();
      console.log('✅ Image upload endpoint working');
      console.log('Response:', imageResult);
    } else {
      const imageError = await imageResponse.text();
      console.log('❌ Image upload failed:', imageError);
    }
  } catch (error) {
    console.log('❌ Image upload error:', error.message);
  }

  console.log('');

  // Test CV upload endpoint
  console.log('📄 Testing CV upload endpoint...');
  try {
    const cvForm = new FormData();
    cvForm.append('file', testPdfBuffer, {
      filename: 'test-cv.pdf',
      contentType: 'application/pdf'
    });

    const cvResponse = await fetch(`${baseUrl}/api/upload/cv`, {
      method: 'POST',
      body: cvForm,
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    console.log('CV upload status:', cvResponse.status);
    if (cvResponse.ok) {
      const cvResult = await cvResponse.json();
      console.log('✅ CV upload endpoint working');
      console.log('Response:', cvResult);
    } else {
      const cvError = await cvResponse.text();
      console.log('❌ CV upload failed:', cvError);
    }
  } catch (error) {
    console.log('❌ CV upload error:', error.message);
  }

  console.log('\n🏁 Test completed!');
}

testUploadEndpoints();
