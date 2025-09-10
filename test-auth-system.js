/**
 * Simple Auth System Test
 * Tests the simplified authentication system
 */

console.log('🧪 Testing Simplified Auth System...\n')

// Test 1: Check if main auth files exist
const fs = require('fs')
const path = require('path')

const requiredFiles = [
  'lib/auth/auth-context.tsx',
  'hooks/useAuth.ts',
  'lib/auth-redirect.ts',
  'app/api/auth/me/route.ts',
  'app/api/auth/select-role/route.ts'
]

console.log('📁 Checking required files...')
let filesOk = true
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`)
  } else {
    console.log(`❌ ${file} - MISSING`)
    filesOk = false
  }
})

// Test 2: Check if duplicate files were removed
const duplicateFiles = [
  'hooks/useRoleManagement.ts',
  'hooks/useRoleSelection.ts',
  'hooks/usePermissions.ts',
  'services/auth/roleService.ts',
  'services/auth/userService.ts',
  'app/api/auth/update-role',
  'lib/auth/use-auth.ts'
]

console.log('\n🗑️  Checking duplicate files were removed...')
let duplicatesRemoved = true
duplicateFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`✅ ${file} - REMOVED`)
  } else {
    console.log(`❌ ${file} - STILL EXISTS`)
    duplicatesRemoved = false
  }
})

// Test 3: Check auth context structure
console.log('\n🔍 Checking auth context structure...')
let contextOk = true
try {
  const authContextContent = fs.readFileSync('lib/auth/auth-context.tsx', 'utf8')
  
  const requiredExports = [
    'export interface AuthContextType',
    'export function AuthProvider',
    'export function useAuth',
    'hasPermission',
    'selectRole',
    'signIn',
    'signOut'
  ]
  
  requiredExports.forEach(exportItem => {
    if (authContextContent.includes(exportItem)) {
      console.log(`✅ ${exportItem}`)
    } else {
      console.log(`❌ ${exportItem} - MISSING`)
      contextOk = false
    }
  })
} catch (error) {
  console.log(`❌ Error reading auth context: ${error.message}`)
  contextOk = false
}

// Test 4: Check simplified redirect logic
console.log('\n🔄 Checking redirect logic...')
let redirectOk = true
try {
  const redirectContent = fs.readFileSync('lib/auth-redirect.ts', 'utf8')
  
  const requiredFunctions = [
    'getSimpleRedirect',
    'getPostLoginRedirect',
    'isAuthorizedForPath'
  ]
  
  requiredFunctions.forEach(func => {
    if (redirectContent.includes(`function ${func}`)) {
      console.log(`✅ ${func}`)
    } else {
      console.log(`❌ ${func} - MISSING`)
      redirectOk = false
    }
  })
  
  // Check if complex logic was removed
  const complexPatterns = [
    'verificationStatus',
    'profile completion',
    'volunteer',
    'moderator'
  ]
  
  complexPatterns.forEach(pattern => {
    if (!redirectContent.toLowerCase().includes(pattern.toLowerCase())) {
      console.log(`✅ Complex logic removed: ${pattern}`)
    } else {
      console.log(`⚠️  Complex logic still present: ${pattern}`)
    }
  })
  
} catch (error) {
  console.log(`❌ Error reading redirect logic: ${error.message}`)
  redirectOk = false
}

// Test 5: Check database migrations
console.log('\n🗄️  Checking database structure...')
let dbOk = true
try {
  const schemaContent = fs.readFileSync('supabase/migrations/20250901000002_create_simplified_schema.sql', 'utf8')
  
  const requiredTables = [
    'CREATE TABLE public.profiles',
    'CREATE TABLE public.roles',
    'CREATE TABLE public.user_roles'
  ]
  
  requiredTables.forEach(table => {
    if (schemaContent.includes(table)) {
      console.log(`✅ ${table}`)
    } else {
      console.log(`❌ ${table} - MISSING`)
      dbOk = false
    }
  })
  
  // Check role constraints
  if (schemaContent.includes("CHECK (name IN ('mentor', 'mentee', 'admin'))")) {
    console.log(`✅ Role constraints (mentor, mentee, admin only)`)
  } else {
    console.log(`❌ Role constraints - MISSING OR INCORRECT`)
    dbOk = false
  }
  
} catch (error) {
  console.log(`❌ Error reading database schema: ${error.message}`)
  dbOk = false
}

// Final summary
console.log('\n📊 SUMMARY:')
console.log(`Files Structure: ${filesOk ? '✅ PASS' : '❌ FAIL'}`)
console.log(`Duplicates Removed: ${duplicatesRemoved ? '✅ PASS' : '❌ FAIL'}`)
console.log(`Auth Context: ${contextOk ? '✅ PASS' : '❌ FAIL'}`)
console.log(`Redirect Logic: ${redirectOk ? '✅ PASS' : '❌ FAIL'}`)
console.log(`Database Schema: ${dbOk ? '✅ PASS' : '❌ FAIL'}`)

const allTestsPassed = filesOk && duplicatesRemoved && contextOk && redirectOk && dbOk

if (allTestsPassed) {
  console.log('\n🎉 ALL TESTS PASSED! Auth system is simplified and ready for Campus Party!')
} else {
  console.log('\n⚠️  Some tests failed. Please review the issues above.')
}

console.log('\n🚀 Next steps:')
console.log('1. Test login flow in browser')
console.log('2. Test role selection')
console.log('3. Test permissions')
console.log('4. Test logout')
console.log('5. Deploy to production')