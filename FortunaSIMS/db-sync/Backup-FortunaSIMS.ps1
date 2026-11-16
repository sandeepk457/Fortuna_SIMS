$ErrorActionPreference = "Stop"

$PgBin = "C:\Program Files\PostgreSQL\18\bin"
$PgDump = Join-Path $PgBin "pg_dump.exe"
$PgRestore = Join-Path $PgBin "pg_restore.exe"

$LocalDB = "fortuna_sims_db"
$LocalUser = "postgres"
$BackupFolder = Join-Path $PSScriptRoot "backups"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

$LocalBackup = Join-Path $BackupFolder "FortunaSIMS_Local_$Timestamp.dump"
$NeonBackup = Join-Path $BackupFolder "FortunaSIMS_Neon_$Timestamp.dump"

try {
    if (!(Test-Path $PgDump)) {
        throw "pg_dump not found"
    }

    if (!(Test-Path $PgRestore)) {
        throw "pg_restore not found"
    }

    if ([string]::IsNullOrWhiteSpace($env:NEON_DATABASE_URL)) {
        throw "NEON_DATABASE_URL is not configured"
    }

    New-Item -ItemType Directory -Path $BackupFolder -Force | Out-Null

    $LocalPasswordSecure = Read-Host "Enter LOCAL PostgreSQL password" -AsSecureString
    $LocalPassword = [System.Net.NetworkCredential]::new("", $LocalPasswordSecure).Password
    $env:PGPASSWORD = $LocalPassword

    Write-Host "`nBacking up local FortunaSIMS database..." -ForegroundColor Yellow

    & $PgDump -h localhost -p 5432 -U $LocalUser -d $LocalDB -Fc --no-owner --no-privileges -f $LocalBackup

    if ($LASTEXITCODE -ne 0) {
        throw "Local backup failed"
    }

    & $PgRestore --list $LocalBackup | Out-Null

    if ($LASTEXITCODE -ne 0) {
        throw "Local backup verification failed"
    }

    Write-Host "Local backup verified: $LocalBackup" -ForegroundColor Green

    Write-Host "`nBacking up current Neon database..." -ForegroundColor Yellow

    & $PgDump "--dbname=$env:NEON_DATABASE_URL" -Fc --no-owner --no-privileges -f $NeonBackup

    if ($LASTEXITCODE -ne 0) {
        throw "Neon backup failed"
    }

    & $PgRestore --list $NeonBackup | Out-Null

    if ($LASTEXITCODE -ne 0) {
        throw "Neon backup verification failed"
    }

    Write-Host "`nBoth backups completed and verified!" -ForegroundColor Green
    Write-Host "Local backup: $LocalBackup"
    Write-Host "Neon backup:  $NeonBackup"
    Write-Host "`nNo database restore was performed." -ForegroundColor Cyan
}
catch {
    Write-Host "`nERROR: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    $LocalPassword = $null
    $LocalPasswordSecure = $null
}