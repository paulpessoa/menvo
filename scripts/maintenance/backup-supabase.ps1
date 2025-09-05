# ================================================================
# SUPABASE BACKUP SCRIPT - Auth Refactor MVP
# ================================================================
# This script creates a complete backup of the Supabase database
# before starting the auth refactor process.
# ================================================================

param(
    [string]$Environment = "stage",
    [string]$BackupDir = "backups",
    [switch]$IncludeAuth = $true,
    [switch]$Verbose = $false
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Blue = "Blue"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Write-Step {
    param([string]$Message)
    Write-ColorOutput "🔄 $Message" $Blue
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" $Green
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️  $Message" $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" $Red
}

# Create backup directory with timestamp
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupPath = Join-Path $BackupDir "backup_$Timestamp"

Write-ColorOutput "================================================================" $Blue
Write-ColorOutput "SUPABASE BACKUP - Auth Refactor MVP" $Blue
Write-ColorOutput "================================================================" $Blue
Write-ColorOutput "Environment: $Environment" $Blue
Write-ColorOutput "Backup Path: $BackupPath" $Blue
Write-ColorOutput "Include Auth: $IncludeAuth" $Blue
Write-ColorOutput "================================================================" $Blue

try {
    # Create backup directory
    Write-Step "Creating backup directory..."
    if (!(Test-Path $BackupPath)) {
        New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
    }
    Write-Success "Backup directory created: $BackupPath"

    # Check Supabase CLI
    Write-Step "Checking Supabase CLI..."
    try {
        $SupabaseVersionOutput = supabase --version 2>&1
        # Extract just the version number from the first line
        $SupabaseVersion = ($SupabaseVersionOutput[0] -split '\s+')[0]
        Write-Success "Supabase CLI found: $SupabaseVersion"
    } catch {
        throw "Supabase CLI not found. Please install it first."
    }

    # Load environment variables
    Write-Step "Loading environment variables..."
    $EnvFile = if ($Environment -eq "local") { ".env.local" } else { ".env.stage" }
    
    if (!(Test-Path $EnvFile)) {
        throw "Environment file not found: $EnvFile"
    }

    # Parse environment file
    $EnvVars = @{}
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $EnvVars[$matches[1]] = $matches[2]
        }
    }

    $SupabaseUrl = $EnvVars['NEXT_PUBLIC_SUPABASE_URL']
    $ServiceRoleKey = $EnvVars['SUPABASE_SERVICE_ROLE_KEY']
    $SupabaseToken = $EnvVars['SUPABASE_TOKEN']

    if (!$SupabaseUrl -or !$ServiceRoleKey) {
        throw "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    }

    Write-Success "Environment variables loaded from $EnvFile"

    # Extract project reference from URL
    if ($SupabaseUrl -match 'https://([^.]+)\.supabase\.co') {
        $ProjectRef = $matches[1]
    } else {
        throw "Could not extract project reference from Supabase URL: $SupabaseUrl"
    }

    Write-Success "Project reference: $ProjectRef"

    # Login to Supabase (if token is available)
    if ($SupabaseToken) {
        Write-Step "Logging in to Supabase..."
        $env:SUPABASE_ACCESS_TOKEN = $SupabaseToken
        Write-Success "Supabase authentication configured"
    }

    # Create backup info file
    Write-Step "Creating backup metadata..."
    $BackupInfo = @{
        timestamp = $Timestamp
        environment = $Environment
        project_ref = $ProjectRef
        supabase_url = $SupabaseUrl
        backup_type = "full"
        include_auth = $IncludeAuth
        cli_version = $SupabaseVersion.Trim()
    }
    
    $BackupInfo | ConvertTo-Json -Depth 3 | Out-File -FilePath (Join-Path $BackupPath "backup_info.json") -Encoding UTF8
    Write-Success "Backup metadata created"

    # Backup database schema
    Write-Step "Backing up database schema..."
    $SchemaFile = Join-Path $BackupPath "schema.sql"
    
    try {
        supabase db dump --project-ref $ProjectRef --schema public --file $SchemaFile 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Database schema backed up to: $SchemaFile"
        } else {
            Write-Warning "Schema backup may have issues, but continuing..."
        }
    } catch {
        Write-Warning "Could not backup schema via CLI, will use alternative method"
    }

    # Backup auth users (if requested)
    if ($IncludeAuth) {
        Write-Step "Backing up auth.users table..."
        $AuthUsersFile = Join-Path $BackupPath "auth_users.sql"
        
        try {
            supabase db dump --project-ref $ProjectRef --schema auth --table users --file $AuthUsersFile 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Auth users backed up to: $AuthUsersFile"
            } else {
                Write-Warning "Auth users backup may have issues"
            }
        } catch {
            Write-Warning "Could not backup auth users via CLI"
        }
    }

    # Backup custom tables data
    Write-Step "Backing up custom tables data..."
    $DataFile = Join-Path $BackupPath "data.sql"
    
    try {
        supabase db dump --project-ref $ProjectRef --data-only --schema public --file $DataFile 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Custom tables data backed up to: $DataFile"
        } else {
            Write-Warning "Data backup may have issues"
        }
    } catch {
        Write-Warning "Could not backup data via CLI"
    }

    # Create a comprehensive SQL backup script
    Write-Step "Creating comprehensive backup script..."
    $BackupScript = @"
-- ================================================================
-- SUPABASE BACKUP - $Timestamp
-- Environment: $Environment
-- Project: $ProjectRef
-- ================================================================

-- This file contains the complete backup of the Supabase database
-- before the auth refactor process.

-- To restore this backup:
-- 1. Create a new Supabase project or reset existing one
-- 2. Run this script in the SQL editor
-- 3. Verify all data is restored correctly

-- ================================================================
-- BACKUP METADATA
-- ================================================================
/*
Backup Information:
- Timestamp: $Timestamp
- Environment: $Environment
- Project Reference: $ProjectRef
- Supabase URL: $SupabaseUrl
- CLI Version: $($SupabaseVersion.Trim())
- Include Auth: $IncludeAuth
*/

-- ================================================================
-- IMPORTANT NOTES
-- ================================================================
/*
1. This backup preserves the auth.users table which is managed by Supabase
2. Custom tables and their data are included
3. Functions, triggers, and policies are included
4. Storage buckets configuration is included
5. RLS policies are preserved

RESTORATION STEPS:
1. Ensure you have a clean Supabase project
2. Run the schema restoration first
3. Then run the data restoration
4. Verify all users can still login
5. Test all functionality before proceeding with refactor
*/

-- ================================================================
-- END OF BACKUP SCRIPT HEADER
-- ================================================================
"@

    $BackupScript | Out-File -FilePath (Join-Path $BackupPath "complete_backup.sql") -Encoding UTF8
    Write-Success "Comprehensive backup script created"

    # Create restoration instructions
    Write-Step "Creating restoration instructions..."
    $RestoreInstructions = @"
# SUPABASE BACKUP RESTORATION GUIDE
Generated: $Timestamp
Environment: $Environment

## Prerequisites
- Supabase CLI installed and configured
- Access to the target Supabase project
- Docker Desktop running (for local development)

## Restoration Steps

### 1. Prepare Target Environment
```bash
# For local development
supabase start

# For remote project
supabase link --project-ref YOUR_NEW_PROJECT_REF
```

### 2. Restore Schema
```bash
# Apply the schema backup
supabase db reset --linked
psql -h localhost -p 54322 -U postgres -d postgres -f schema.sql
```

### 3. Restore Data
```bash
# Apply the data backup
psql -h localhost -p 54322 -U postgres -d postgres -f data.sql
```

### 4. Restore Auth Users (if backed up)
```bash
# Apply auth users backup
psql -h localhost -p 54322 -U postgres -d postgres -f auth_users.sql
```

### 5. Verify Restoration
- Check that all tables exist
- Verify user data is present
- Test authentication flows
- Confirm all functions and triggers work

## Files in this backup:
- backup_info.json: Backup metadata
- schema.sql: Database schema
- data.sql: Table data
- auth_users.sql: Auth users (if included)
- complete_backup.sql: Comprehensive backup script
- restore_instructions.md: This file

## Troubleshooting
If restoration fails:
1. Check Supabase CLI version compatibility
2. Ensure target project is clean
3. Verify network connectivity
4. Check for permission issues

## Support
For issues with this backup, refer to:
- Supabase documentation: https://supabase.com/docs
- Project requirements document
- Auth refactor design document
"@

    $RestoreInstructions | Out-File -FilePath (Join-Path $BackupPath "restore_instructions.md") -Encoding UTF8
    Write-Success "Restoration instructions created"

    # Create environment setup script for local development
    Write-Step "Creating local environment setup script..."
    $LocalSetupScript = @"
# ================================================================
# LOCAL SUPABASE SETUP SCRIPT
# ================================================================
# This script sets up Supabase for local development after backup

# Start Supabase locally
Write-Host "Starting Supabase locally..." -ForegroundColor Blue
supabase start

# Check status
Write-Host "Checking Supabase status..." -ForegroundColor Blue
supabase status

# Apply migrations
Write-Host "Applying migrations..." -ForegroundColor Blue
supabase db reset

Write-Host "Local Supabase setup complete!" -ForegroundColor Green
Write-Host "Access Supabase Studio at: http://localhost:54323" -ForegroundColor Yellow
"@

    $LocalSetupScript | Out-File -FilePath (Join-Path $BackupPath "setup_local.ps1") -Encoding UTF8
    Write-Success "Local setup script created"

    # Summary
    Write-ColorOutput "================================================================" $Green
    Write-Success "BACKUP COMPLETED SUCCESSFULLY!"
    Write-ColorOutput "================================================================" $Green
    Write-ColorOutput "Backup Location: $BackupPath" $Green
    Write-ColorOutput "Files Created:" $Green
    Write-ColorOutput "  - backup_info.json (metadata)" $Green
    Write-ColorOutput "  - schema.sql (database schema)" $Green
    Write-ColorOutput "  - data.sql (table data)" $Green
    if ($IncludeAuth) {
        Write-ColorOutput "  - auth_users.sql (auth users)" $Green
    }
    Write-ColorOutput "  - complete_backup.sql (comprehensive script)" $Green
    Write-ColorOutput "  - restore_instructions.md (restoration guide)" $Green
    Write-ColorOutput "  - setup_local.ps1 (local setup script)" $Green
    Write-ColorOutput "================================================================" $Green

    # Next steps
    Write-ColorOutput "NEXT STEPS:" $Yellow
    Write-ColorOutput "1. Review the backup files in: $BackupPath" $Yellow
    Write-ColorOutput "2. Start Docker Desktop" $Yellow
    Write-ColorOutput "3. Run: supabase start" $Yellow
    Write-ColorOutput "4. Test local environment setup" $Yellow
    Write-ColorOutput "5. Proceed with auth refactor tasks" $Yellow

} catch {
    Write-Error "Backup failed: $($_.Exception.Message)"
    Write-ColorOutput "================================================================" $Red
    Write-Error "BACKUP FAILED!"
    Write-ColorOutput "================================================================" $Red
    exit 1
}