#!/usr/bin/env node

/**
 * Supabase Environment Switcher
 * 
 * This script helps switch between local and production Supabase configurations
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Supabase configurations
const CONFIGS = {
  local: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
    SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  },
  production: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://evxrzmzkghshjmmyegxu.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2eHJ6bXprZ2hzaGptbXllZ3h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMDU3NzIsImV4cCI6MjA2NTg4MTc3Mn0.MAi7yasZdpozOuJ9L6kmUwoXJsLs9tqZ_Vhvs1GM19I',
    SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2eHJ6bXprZ2hzaGptbXllZ3h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDMwNTc3MiwiZXhwIjoyMDY1ODgxNzcyfQ.qsHm4-o7H_XVHobWPdxIlPK-sxvBLTxlBA9PFiwfla4'
  }
};

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return env;
}

function writeEnvFile(filePath, env) {
  const lines = [];
  
  // Add header comment
  lines.push('# Supabase Configuration');
  
  // Add Supabase variables first
  const supabaseKeys = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
  supabaseKeys.forEach(key => {
    if (env[key]) {
      lines.push(`${key}=${env[key]}`);
    }
  });
  
  lines.push(''); // Empty line
  
  // Add other variables
  Object.entries(env).forEach(([key, value]) => {
    if (!supabaseKeys.includes(key)) {
      lines.push(`${key}=${value}`);
    }
  });
  
  fs.writeFileSync(filePath, lines.join('\n') + '\n');
}

function getCurrentConfig() {
  const env = readEnvFile('.env.local');
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!url) {
    return 'unknown';
  }
  
  if (url.includes('127.0.0.1') || url.includes('localhost')) {
    return 'local';
  }
  
  if (url.includes('evxrzmzkghshjmmyegxu.supabase.co')) {
    return 'production';
  }
  
  return 'custom';
}

function switchToEnvironment(targetEnv) {
  const currentEnv = readEnvFile('.env.local');
  const config = CONFIGS[targetEnv];
  
  if (!config) {
    log(`❌ Unknown environment: ${targetEnv}`, 'red');
    log('Available environments: local, production', 'yellow');
    return false;
  }
  
  // Update Supabase configuration
  Object.entries(config).forEach(([key, value]) => {
    currentEnv[key] = value;
  });
  
  // Write updated configuration
  writeEnvFile('.env.local', currentEnv);
  
  return true;
}

function showCurrentStatus() {
  const current = getCurrentConfig();
  const env = readEnvFile('.env.local');
  
  log('🔍 Current Supabase Configuration', 'blue');
  log('================================', 'blue');
  log(`Environment: ${current}`, current === 'local' ? 'green' : 'yellow');
  log(`URL: ${env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}`, 'cyan');
  
  if (current === 'local') {
    log('✅ Frontend is pointing to LOCAL Supabase', 'green');
    log('   - API: http://127.0.0.1:54321', 'green');
    log('   - Studio: http://127.0.0.1:54323', 'green');
  } else if (current === 'production') {
    log('🌐 Frontend is pointing to PRODUCTION Supabase', 'yellow');
    log('   - API: https://evxrzmzkghshjmmyegxu.supabase.co', 'yellow');
  } else {
    log('⚠️  Frontend is pointing to UNKNOWN Supabase', 'red');
  }
}

function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `backups/env-backup-${timestamp}.env`;
  
  if (!fs.existsSync('backups')) {
    fs.mkdirSync('backups', { recursive: true });
  }
  
  if (fs.existsSync('.env.local')) {
    fs.copyFileSync('.env.local', backupPath);
    log(`📄 Backup created: ${backupPath}`, 'cyan');
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'status':
      showCurrentStatus();
      break;
      
    case 'local':
      log('🔄 Switching to LOCAL Supabase...', 'blue');
      createBackup();
      
      if (switchToEnvironment('local')) {
        log('✅ Successfully switched to LOCAL Supabase!', 'green');
        log('   Frontend will now use: http://127.0.0.1:54321', 'green');
        log('   Restart your Next.js app to apply changes', 'yellow');
      }
      break;
      
    case 'production':
      log('🔄 Switching to PRODUCTION Supabase...', 'blue');
      createBackup();
      
      if (switchToEnvironment('production')) {
        log('✅ Successfully switched to PRODUCTION Supabase!', 'green');
        log('   Frontend will now use: https://evxrzmzkghshjmmyegxu.supabase.co', 'green');
        log('   Restart your Next.js app to apply changes', 'yellow');
      }
      break;
      
    case 'help':
    default:
      log('🔧 Supabase Environment Switcher', 'blue');
      log('===============================', 'blue');
      log('');
      log('Usage: node scripts/switch-supabase-env.js [command]');
      log('');
      log('Commands:');
      log('  status      Show current Supabase configuration');
      log('  local       Switch to local Supabase (http://127.0.0.1:54321)');
      log('  production  Switch to production Supabase');
      log('  help        Show this help message');
      log('');
      log('Examples:');
      log('  node scripts/switch-supabase-env.js status');
      log('  node scripts/switch-supabase-env.js local');
      log('  node scripts/switch-supabase-env.js production');
      break;
  }
}

main();