#!/usr/bin/env node

/**
 * Production Data Synchronization Script
 * 
 * This script exports data from production Supabase and imports it to local development.
 * It handles auth users, profiles, user_roles, and related tables safely.
 */

// Load environment variables from both .env and .env.local
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const CONFIG = {
  production: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  local: {
    url: 'http://127.0.0.1:54321',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  },
  backupDir: 'backups/production-sync'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(message) {
  log(`🔄 ${message}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

async function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function validateEnvironment() {
  logStep('Validating environment configuration...');

  // Check production environment variables
  if (!CONFIG.production.url || !CONFIG.production.key) {
    logError('Missing production Supabase configuration!');
    logError('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Test production connection
  try {
    const prodClient = createClient(CONFIG.production.url, CONFIG.production.key);
    const { data, error } = await prodClient.from('profiles').select('count').limit(1);
    if (error) throw error;
    logSuccess('Production Supabase connection verified');
  } catch (error) {
    logError(`Failed to connect to production: ${error.message}`);
    process.exit(1);
  }

  // Test local connection
  try {
    const localClient = createClient(CONFIG.local.url, CONFIG.local.key);
    const { data, error } = await localClient.from('profiles').select('count').limit(1);
    if (error) throw error;
    logSuccess('Local Supabase connection verified');
  } catch (error) {
    logError(`Failed to connect to local Supabase: ${error.message}`);
    logError('Make sure Supabase is running locally with: supabase start');
    process.exit(1);
  }

  logSuccess('Environment validation completed');
}

async function exportProductionData() {
  logStep('Exporting data from production...');

  const prodClient = createClient(CONFIG.production.url, CONFIG.production.key);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Create backup directory
  const backupPath = path.join(CONFIG.backupDir, `export-${timestamp}`);
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }

  const exportData = {
    timestamp,
    metadata: {
      production_url: CONFIG.production.url,
      export_date: new Date().toISOString()
    }
  };

  try {
    // Export auth users
    logStep('Exporting auth users...');
    const { data: authUsers, error: authError } = await prodClient.auth.admin.listUsers();
    if (authError) throw authError;
    
    exportData.auth_users = authUsers.users;
    logSuccess(`Exported ${authUsers.users.length} auth users`);

    // Export profiles
    logStep('Exporting profiles...');
    const { data: profiles, error: profilesError } = await prodClient
      .from('profiles')
      .select('*');
    if (profilesError) throw profilesError;
    
    exportData.profiles = profiles;
    logSuccess(`Exported ${profiles.length} profiles`);

    // Export roles
    logStep('Exporting roles...');
    const { data: roles, error: rolesError } = await prodClient
      .from('roles')
      .select('*');
    if (rolesError) throw rolesError;
    
    exportData.roles = roles;
    logSuccess(`Exported ${roles.length} roles`);

    // Export user_roles
    logStep('Exporting user roles...');
    const { data: userRoles, error: userRolesError } = await prodClient
      .from('user_roles')
      .select('*');
    if (userRolesError) throw userRolesError;
    
    exportData.user_roles = userRoles;
    logSuccess(`Exported ${userRoles.length} user role assignments`);

    // Export mentor_availability (if exists)
    try {
      logStep('Exporting mentor availability...');
      const { data: mentorAvailability, error: mentorError } = await prodClient
        .from('mentor_availability')
        .select('*');
      if (mentorError) throw mentorError;
      
      exportData.mentor_availability = mentorAvailability;
      logSuccess(`Exported ${mentorAvailability.length} mentor availability records`);
    } catch (error) {
      logWarning('mentor_availability table not found or accessible');
      exportData.mentor_availability = [];
    }

    // Export appointments (if exists)
    try {
      logStep('Exporting appointments...');
      const { data: appointments, error: appointmentsError } = await prodClient
        .from('appointments')
        .select('*');
      if (appointmentsError) throw appointmentsError;
      
      exportData.appointments = appointments;
      logSuccess(`Exported ${appointments.length} appointments`);
    } catch (error) {
      logWarning('appointments table not found or accessible');
      exportData.appointments = [];
    }

    // Save export data
    const exportFile = path.join(backupPath, 'production-export.json');
    fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));
    
    logSuccess(`Production data exported to: ${exportFile}`);
    return exportFile;

  } catch (error) {
    logError(`Export failed: ${error.message}`);
    throw error;
  }
}

async function importToLocal(exportFile) {
  logStep('Importing data to local Supabase...');

  const localClient = createClient(CONFIG.local.url, CONFIG.local.key);
  
  try {
    const exportData = JSON.parse(fs.readFileSync(exportFile, 'utf8'));
    
    log(`📂 Importing data from: ${exportData.timestamp}`, 'cyan');

    // Clear existing data first (with confirmation)
    const clearConfirm = await askQuestion('⚠️  This will clear existing local data. Continue? (y/N): ');
    if (clearConfirm.toLowerCase() !== 'y') {
      log('Import cancelled by user');
      return;
    }

    // Clear data in reverse dependency order
    logStep('Clearing existing local data...');
    
    // Clear appointments first
    if (exportData.appointments) {
      await localClient.from('appointments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }
    
    // Clear mentor availability
    if (exportData.mentor_availability) {
      await localClient.from('mentor_availability').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }
    
    // Clear user roles
    await localClient.from('user_roles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Clear profiles
    await localClient.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Clear auth users
    const { data: existingUsers } = await localClient.auth.admin.listUsers();
    for (const user of existingUsers.users) {
      await localClient.auth.admin.deleteUser(user.id);
    }
    
    logSuccess('Existing data cleared');

    // Import roles first (they're referenced by user_roles)
    if (exportData.roles && exportData.roles.length > 0) {
      logStep('Importing roles...');
      const { error: rolesError } = await localClient
        .from('roles')
        .upsert(exportData.roles, { onConflict: 'id' });
      
      if (rolesError) {
        logWarning(`Roles import warning: ${rolesError.message}`);
      } else {
        logSuccess(`Imported ${exportData.roles.length} roles`);
      }
    }

    // Import auth users
    logStep('Importing auth users...');
    let importedUsers = 0;
    for (const authUser of exportData.auth_users) {
      try {
        const { data: newUser, error } = await localClient.auth.admin.createUser({
          id: authUser.id,
          email: authUser.email,
          password: 'temp_password_123!', // Temporary password for local testing
          email_confirm: true,
          user_metadata: authUser.user_metadata || {},
          app_metadata: authUser.app_metadata || {}
        });

        if (error) {
          logWarning(`Failed to import user ${authUser.email}: ${error.message}`);
        } else {
          importedUsers++;
        }
      } catch (error) {
        logWarning(`Error importing user ${authUser.email}: ${error.message}`);
      }
    }
    logSuccess(`Imported ${importedUsers}/${exportData.auth_users.length} auth users`);

    // Import profiles
    if (exportData.profiles && exportData.profiles.length > 0) {
      logStep('Importing profiles...');
      const { error: profilesError } = await localClient
        .from('profiles')
        .insert(exportData.profiles);

      if (profilesError) {
        logWarning(`Profiles import warning: ${profilesError.message}`);
      } else {
        logSuccess(`Imported ${exportData.profiles.length} profiles`);
      }
    }

    // Import user roles
    if (exportData.user_roles && exportData.user_roles.length > 0) {
      logStep('Importing user roles...');
      const { error: userRolesError } = await localClient
        .from('user_roles')
        .insert(exportData.user_roles);

      if (userRolesError) {
        logWarning(`User roles import warning: ${userRolesError.message}`);
      } else {
        logSuccess(`Imported ${exportData.user_roles.length} user role assignments`);
      }
    }

    // Import mentor availability
    if (exportData.mentor_availability && exportData.mentor_availability.length > 0) {
      logStep('Importing mentor availability...');
      const { error: mentorError } = await localClient
        .from('mentor_availability')
        .insert(exportData.mentor_availability);

      if (mentorError) {
        logWarning(`Mentor availability import warning: ${mentorError.message}`);
      } else {
        logSuccess(`Imported ${exportData.mentor_availability.length} mentor availability records`);
      }
    }

    // Import appointments
    if (exportData.appointments && exportData.appointments.length > 0) {
      logStep('Importing appointments...');
      const { error: appointmentsError } = await localClient
        .from('appointments')
        .insert(exportData.appointments);

      if (appointmentsError) {
        logWarning(`Appointments import warning: ${appointmentsError.message}`);
      } else {
        logSuccess(`Imported ${exportData.appointments.length} appointments`);
      }
    }

    logSuccess('Data import completed successfully!');

  } catch (error) {
    logError(`Import failed: ${error.message}`);
    throw error;
  }
}

async function validateDataIntegrity() {
  logStep('Validating data integrity...');

  const localClient = createClient(CONFIG.local.url, CONFIG.local.key);

  try {
    // Check auth users
    const { data: users } = await localClient.auth.admin.listUsers();
    
    // Check profiles
    const { data: profiles } = await localClient.from('profiles').select('*');
    
    // Check user roles
    const { data: userRoles } = await localClient.from('user_roles').select('*');

    log('\n📊 Data Integrity Report:', 'cyan');
    log(`   Auth Users: ${users.users.length}`, 'green');
    log(`   Profiles: ${profiles.length}`, 'green');
    log(`   User Roles: ${userRoles.length}`, 'green');

    // Check for orphaned records
    const profilesWithoutAuth = profiles.filter(p => 
      !users.users.find(u => u.id === p.user_id)
    );
    
    const rolesWithoutAuth = userRoles.filter(r => 
      !users.users.find(u => u.id === r.user_id)
    );

    if (profilesWithoutAuth.length > 0) {
      logWarning(`Found ${profilesWithoutAuth.length} profiles without auth users`);
    }

    if (rolesWithoutAuth.length > 0) {
      logWarning(`Found ${rolesWithoutAuth.length} role assignments without auth users`);
    }

    if (profilesWithoutAuth.length === 0 && rolesWithoutAuth.length === 0) {
      logSuccess('No orphaned records found - data integrity is good!');
    }

    // Display sample users for verification
    if (profiles.length > 0) {
      log('\n👥 Sample imported users:', 'cyan');
      profiles.slice(0, 5).forEach(profile => {
        const hasRole = userRoles.find(r => r.user_id === profile.user_id);
        const roleInfo = hasRole ? ` (${hasRole.role || 'role assigned'})` : ' (no role)';
        log(`   - ${profile.full_name || profile.email}${roleInfo}`, 'green');
      });
    }

    logSuccess('Data integrity validation completed');

  } catch (error) {
    logError(`Validation failed: ${error.message}`);
    throw error;
  }
}

async function main() {
  log('🚀 Production Data Synchronization Tool', 'bright');
  log('=====================================', 'bright');

  try {
    // Step 1: Validate environment
    await validateEnvironment();

    // Step 2: Export production data
    const exportFile = await exportProductionData();

    // Step 3: Import to local
    await importToLocal(exportFile);

    // Step 4: Validate integrity
    await validateDataIntegrity();

    log('\n🎉 Data synchronization completed successfully!', 'green');
    log('You can now test the authentication issues locally.', 'cyan');
    log('\nNext steps:', 'yellow');
    log('1. Test OAuth login flows', 'yellow');
    log('2. Test user role assignment', 'yellow');
    log('3. Test password recovery', 'yellow');
    log('4. Verify cascade delete behavior', 'yellow');

  } catch (error) {
    logError(`\nSynchronization failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  exportProductionData,
  importToLocal,
  validateDataIntegrity
};
