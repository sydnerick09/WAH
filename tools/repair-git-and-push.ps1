# Rebuild the local Git metadata from the real GitHub main branch, preserving
# the remote commit history. Run this script from the GWENO project folder.
$ErrorActionPreference = 'Stop'
$RepoUrl = 'https://github.com/sydnerick09/WAH.git'
$Branch = 'main'
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$Stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$TempRoot = Join-Path ([System.IO.Path]::GetTempPath()) "gweno-git-repair-$Stamp"
$CleanClone = Join-Path $TempRoot 'repo'
$BackupGit = Join-Path $ProjectRoot ".git-corrupt-backup-$Stamp"

function Invoke-Git {
    param([string]$WorkingDirectory, [string[]]$GitArgs)
    & git -C $WorkingDirectory @GitArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Git command failed: git $($GitArgs -join ' ')"
    }
}

try {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        throw 'Git is not installed or is not available in PATH.'
    }

    New-Item -ItemType Directory -Path $TempRoot -Force | Out-Null
    Write-Host '1/5 Downloading the existing GitHub main branch...' -ForegroundColor Cyan
    & git clone --branch $Branch --single-branch $RepoUrl $CleanClone
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not clone GitHub main. Check your internet connection and GitHub access.'
    }

    Write-Host '2/5 Copying your current project files over the clean clone...' -ForegroundColor Cyan
    # Keep Git history and machine-specific files out of the copy operation.
    $RobocopyArgs = @(
        $ProjectRoot, $CleanClone, '/E', '/R:2', '/W:2', '/NFL', '/NDL', '/NP',
        '/XD', '.git', 'node_modules', '.next', '.vercel', '.gradle',
        'build', 'dist', 'coverage',
        '/XF', '.env', '.env.local', '.env.*.local', '*.keystore', '*.jks'
    )
    & robocopy @RobocopyArgs
    if ($LASTEXITCODE -ge 8) {
        throw "File copy failed (Robocopy exit code $LASTEXITCODE)."
    }

    Write-Host '3/5 Creating a commit on the existing main history...' -ForegroundColor Cyan
    Invoke-Git $CleanClone @('add', '-A')
    & git -C $CleanClone diff --cached --quiet
    if ($LASTEXITCODE -eq 1) {
        Invoke-Git $CleanClone @('commit', '-m', 'Repair GWENO project and Android app')
    } elseif ($LASTEXITCODE -ne 0) {
        throw 'Could not inspect staged changes.'
    } else {
        Write-Host 'No file changes to commit; checking the existing main branch.'
    }

    Write-Host '4/5 Pushing to GitHub main (no force push)...' -ForegroundColor Cyan
    Invoke-Git $CleanClone @('push', 'origin', $Branch)

    Write-Host '5/5 Replacing the damaged local Git metadata...' -ForegroundColor Cyan
    if (Test-Path (Join-Path $ProjectRoot '.git')) {
        Move-Item (Join-Path $ProjectRoot '.git') $BackupGit
    }
    Copy-Item (Join-Path $CleanClone '.git') (Join-Path $ProjectRoot '.git') -Recurse

    Write-Host ''
    Write-Host 'SUCCESS: GitHub main was updated and this project now has clean Git metadata.' -ForegroundColor Green
    Write-Host "Damaged Git backup: $BackupGit" -ForegroundColor Yellow
    Write-Host 'You can now deploy from Vercel using the main branch.' -ForegroundColor Green
}
catch {
    Write-Host "REPAIR STOPPED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'Your original project and its existing .git folder have not been deleted.' -ForegroundColor Yellow
    exit 1
}
finally {
    if (Test-Path $TempRoot) {
        Remove-Item $TempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}
