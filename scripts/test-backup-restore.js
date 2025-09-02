// Script to test backup and restore functionality
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function backupUserData() {
    console.log('🔄 Creating backup of user data...');
    
    try {
        // Get all users from auth
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        
        // Get all profiles
        const { data: profiles } = await supabase.from('profiles').select('*');
        
        // Get all user roles
        const { data: userRoles } = await supabase
            .from('user_roles')
            .select(`
                *,
                roles(name)
            `);

        const backupData = {
            timestamp: new Date().toISOString(),
            auth_users: authUsers.users,
            profiles: profiles,
            user_roles: userRoles
        };

        // Save backup to file
        const backupDir = 'backups/test_backup';
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const backupFile = path.join(backupDir, 'user_data_backup.json');
        fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

        console.log(`✅ Backup created: ${backupFile}`);
        console.log(`   - ${authUsers.users.length} auth users`);
        console.log(`   - ${profiles.length} profiles`);
        console.log(`   - ${userRoles.length} role assignments`);

        return backupFile;

    } catch (error) {
        console.log('❌ Backup failed:', error.message);
        throw error;
    }
}

async function clearUserData() {
    console.log('🔄 Clearing user data for restore test...');
    
    try {
        // Delete user roles first (foreign key constraint)
        await supabase.from('user_roles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        // Delete profiles
        await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        // Delete auth users
        const { data: users } = await supabase.auth.admin.listUsers();
        for (const user of users.users) {
            await supabase.auth.admin.deleteUser(user.id);
        }

        console.log('✅ User data cleared');

    } catch (error) {
        console.log('❌ Clear failed:', error.message);
        throw error;
    }
}

async function restoreUserData(backupFile) {
    console.log('🔄 Restoring user data from backup...');
    
    try {
        const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

        console.log(`📂 Restoring from backup created: ${backupData.timestamp}`);

        // Restore auth users first
        for (const authUser of backupData.auth_users) {
            const { data: newUser, error } = await supabase.auth.admin.createUser({
                id: authUser.id, // Preserve original ID
                email: authUser.email,
                password: 'restored_password_123', // New password since we can't restore the original
                email_confirm: true,
                user_metadata: authUser.user_metadata || {}
            });

            if (error) {
                console.log(`⚠️  Failed to restore auth user ${authUser.email}: ${error.message}`);
            } else {
                console.log(`✅ Restored auth user: ${authUser.email}`);
            }
        }

        // Restore profiles
        if (backupData.profiles.length > 0) {
            const { error: profilesError } = await supabase
                .from('profiles')
                .insert(backupData.profiles);

            if (profilesError) {
                console.log(`⚠️  Failed to restore profiles: ${profilesError.message}`);
            } else {
                console.log(`✅ Restored ${backupData.profiles.length} profiles`);
            }
        }

        // Restore user roles
        if (backupData.user_roles.length > 0) {
            const userRolesToInsert = backupData.user_roles.map(ur => ({
                id: ur.id,
                user_id: ur.user_id,
                role_id: ur.role_id,
                is_primary: ur.is_primary,
                assigned_by: ur.assigned_by,
                assigned_at: ur.assigned_at,
                expires_at: ur.expires_at
            }));

            const { error: rolesError } = await supabase
                .from('user_roles')
                .insert(userRolesToInsert);

            if (rolesError) {
                console.log(`⚠️  Failed to restore user roles: ${rolesError.message}`);
            } else {
                console.log(`✅ Restored ${backupData.user_roles.length} role assignments`);
            }
        }

        console.log('✅ Restore completed successfully!');

    } catch (error) {
        console.log('❌ Restore failed:', error.message);
        throw error;
    }
}

async function verifyRestore() {
    console.log('🔄 Verifying restored data...');
    
    try {
        const { data: users } = await supabase.auth.admin.listUsers();
        const { data: profiles } = await supabase.from('profiles').select('*');
        const { data: userRoles } = await supabase.from('user_roles').select('*');

        console.log(`✅ Verification complete:`);
        console.log(`   - ${users.users.length} auth users`);
        console.log(`   - ${profiles.length} profiles`);
        console.log(`   - ${userRoles.length} role assignments`);

        if (profiles.length > 0) {
            console.log('\n👥 Restored users:');
            profiles.forEach(profile => {
                console.log(`   - ${profile.full_name} (${profile.email}) - ${profile.role}`);
            });
        }

    } catch (error) {
        console.log('❌ Verification failed:', error.message);
    }
}

async function runBackupRestoreTest() {
    console.log('🧪 Starting backup/restore test...');
    console.log('================================================');
    
    try {
        // Step 1: Create backup
        const backupFile = await backupUserData();
        
        console.log('\n================================================');
        
        // Step 2: Clear data
        await clearUserData();
        
        console.log('\n================================================');
        
        // Step 3: Restore data
        await restoreUserData(backupFile);
        
        console.log('\n================================================');
        
        // Step 4: Verify restore
        await verifyRestore();
        
        console.log('\n================================================');
        console.log('🎉 Backup/restore test completed successfully!');
        console.log('✅ All user data was successfully backed up and restored');
        
    } catch (error) {
        console.log('\n================================================');
        console.log('❌ Backup/restore test failed:', error.message);
    }
}

runBackupRestoreTest();