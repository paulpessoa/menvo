// Test script to verify local Supabase database setup
const { createClient } = require('@supabase/supabase-js');

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
    console.log('🔄 Testing local Supabase database...');
    
    try {
        // Test 1: Check if roles table exists and has data
        console.log('\n📋 Testing roles table...');
        const { data: roles, error: rolesError } = await supabase
            .from('roles')
            .select('*')
            .limit(5);
            
        if (rolesError) {
            console.log('❌ Roles table error:', rolesError.message);
        } else {
            console.log('✅ Roles table exists with', roles.length, 'records');
            if (roles.length > 0) {
                console.log('   Sample role:', roles[0]);
            }
        }

        // Test 2: Check if permissions table exists
        console.log('\n🔐 Testing permissions table...');
        const { data: permissions, error: permissionsError } = await supabase
            .from('permissions')
            .select('*')
            .limit(5);
            
        if (permissionsError) {
            console.log('❌ Permissions table error:', permissionsError.message);
        } else {
            console.log('✅ Permissions table exists with', permissions.length, 'records');
            if (permissions.length > 0) {
                console.log('   Sample permission:', permissions[0]);
            }
        }

        // Test 3: Check if profiles table exists
        console.log('\n👤 Testing profiles table...');
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .limit(5);
            
        if (profilesError) {
            console.log('❌ Profiles table error:', profilesError.message);
        } else {
            console.log('✅ Profiles table exists with', profiles.length, 'records');
        }

        // Test 4: Check auth.users table
        console.log('\n🔑 Testing auth.users table...');
        const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
            
        if (usersError) {
            console.log('❌ Auth users error:', usersError.message);
        } else {
            console.log('✅ Auth users accessible with', users.users.length, 'users');
        }

        console.log('\n✅ Database test completed successfully!');
        
    } catch (error) {
        console.log('❌ Database test failed:', error.message);
    }
}

testDatabase();
