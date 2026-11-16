# ============================================================
# Fortuna SIMS - Local PostgreSQL to Neon DB Sync
# PostgreSQL 18.3
# ============================================================

$ErrorActionPreference = "Stop"

# PostgreSQL tools
$PgBin = "C:\Program Files\PostgreSQL\18\bin"
$PgDump = Join-Path $PgBin "pg_dump.exe"
$PgRestore = Join-Path $PgBin "pg_restore.exe"
$Psql = Join-Path $PgBin "psql.exe"

# Local database configuration
$LocalHost = "localhost"
$LocalPort = "5432"
$LocalUser = "postgres"
$LocalDB = "fortuna_sims_db"

# Backup directory
$BackupFolder = Join-Path $PSScriptRoot "backups"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

$LocalBackup = Join-Path $BackupFolder "FortunaSIMS_Local_$Timestamp.dump"
$NeonBackup = Join-Path $BackupFolder "FortunaSIMS_Neon_$Timestamp.dump"

try {

    Write-Host "`n============================================" -ForegroundColor Cyan
    Write-Host " Fortuna SIMS - PostgreSQL to Neon Sync" -ForegroundColor Cyan
    Write-Host "============================================`n" -ForegroundColor Cyan

    # Check PostgreSQL tools
    foreach ($Tool in @($PgDump, $PgRestore, $Psql)) {
        if (!(Test-Path $Tool)) {
            throw "PostgreSQL tool not found: $Tool"
        }
    }

    # Check Neon connection string
    if ([string]::IsNullOrWhiteSpace($env:NEON_DATABASE_URL)) {
        throw "NEON_DATABASE_URL environment variable is not configured."
    }

    # Create backup directory
    New-Item -ItemType Directory -Path $BackupFolder -Force | Out-Null

    # Local PostgreSQL password
    $LocalPasswordSecure = Read-Host "Enter LOCAL PostgreSQL password" -AsSecureString
    $LocalPassword = [System.Net.NetworkCredential]::new("", $LocalPasswordSecure).Password

    $env:PGPASSWORD = $LocalPassword

    # Check local DB connection
    Write-Host "`nChecking local database..." -ForegroundColor Yellow

    & $Psql `
        -h $LocalHost `
        -p $LocalPort `
        -U $LocalUser `
        -d $LocalDB `
        -c "SELECT current_database(), version();"

    if ($LASTEXITCODE -ne 0) {
        throw "Local PostgreSQL connection failed."
    }

    # Local database backup
    Write-Host "`nCreating LOCAL database backup..." -ForegroundColor Yellow

    & $PgDump `
        -h $LocalHost `
        -p $LocalPort `
        -U $LocalUser `
        -d $LocalDB `
        -Fc `
        --no-owner `
        --no-privileges `
        -f $LocalBackup

    if ($LASTEXITCODE -ne 0) {
        throw "Local database backup failed."
    }

    if (!(Test-Path $LocalBackup)) {
        throw "Local backup file was not created."
    }

    Write-Host "Local backup created successfully:" -ForegroundColor Green
    Write-Host $LocalBackup

    # Verify local backup
    Write-Host "`nVerifying local backup..." -ForegroundColor Yellow

    & $PgRestore --list $LocalBackup | Out-Null

    if ($LASTEXITCODE -ne 0) {
        throw "Local backup verification failed."
    }

    Write-Host "Local backup verified." -ForegroundColor Green

    # Backup current Neon database
    Write-Host "`nCreating NEON database backup..." -ForegroundColor Yellow

    & $PgDump `
        --dbname=$env:NEON_DATABASE_URL `
        -Fc `
        --no-owner `
        --no-privileges `
        -f $NeonBackup

    if ($LASTEXITCODE -ne 0) {
        throw "Neon database backup failed. Sync cancelled."
    }

    if (!(Test-Path $NeonBackup)) {
        throw "Neon backup file was not created."
    }

    # Verify Neon backup
    & $PgRestore --list $NeonBackup | Out-Null

    if ($LASTEXITCODE -ne 0) {
        throw "Neon backup verification failed."
    }

    Write-Host "Neon backup verified." -ForegroundColor Green

    # Safety confirmation
    Write-Host "`nWARNING: This operation will modify the Neon database." -ForegroundColor Red
    Write-Host "Neon backup is available at:"
    Write-Host $NeonBackup

    $Confirmation = Read-Host "`nType SYNC to continue"

    if ($Confirmation -ne "SYNC") {
        Write-Host "`nSync cancelled. Existing Neon database was not modified." -ForegroundColor Yellow
        return
    }

    # Restore local DB dump to Neon
    Write-Host "`nRestoring LOCAL database to NEON..." -ForegroundColor Yellow

    & $PgRestore `
        --dbname=$env:NEON_DATABASE_URL `
        --clean `
        --if-exists `
        --no-owner `
        --no-privileges `
        --exit-on-error `
        $LocalBackup

    if ($LASTEXITCODE -ne 0) {
        throw "Neon restore failed. Check the error output."
    }

    # Verify Neon connection
    Write-Host "`nVerifying Neon database..." -ForegroundColor Yellow

    & $Psql `
        --dbname=$env:NEON_DATABASE_URL `
        -c "SELECT current_database(), version();"

    if ($LASTEXITCODE -ne 0) {
        throw "Neon verification failed."
    }

    Write-Host "`n============================================" -ForegroundColor Green
    Write-Host " DATABASE SYNC COMPLETED" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green

    Write-Host "`nLocal backup:"
    Write-Host $LocalBackup

    Write-Host "`nNeon backup:"
    Write-Host $NeonBackup

}
catch {
    Write-Host "`nERROR: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    $LocalPassword = $null
    $LocalPasswordSecure = $null
}