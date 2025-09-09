#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Profile Page Improvement Tests...\n');

try {
  // Run specific test files for profile improvements
  const testFiles = [
    '__tests__/hooks/useProfile.test.ts',
    '__tests__/hooks/useFileUpload.test.ts',
    '__tests__/hooks/useUnsavedChanges.test.ts',
    '__tests__/lib/file-validation.test.ts',
  ];

  console.log('📋 Test Files:');
  testFiles.forEach(file => console.log(`  - ${file}`));
  console.log('');

  // Run tests with coverage
  const command = `npx jest ${testFiles.join(' ')} --coverage --verbose`;
  
  console.log('🚀 Executing tests...\n');
  execSync(command, { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('\n✅ All tests completed successfully!');

} catch (error) {
  console.error('\n❌ Tests failed:');
  console.error(error.message);
  process.exit(1);
}
