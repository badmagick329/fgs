function Invoke-Step {
    param(
        [string]$CommandName,
        [scriptblock]$Action
    )

    & $Action

    if ($LASTEXITCODE -ne 0) {
        throw "$CommandName failed with exit code $LASTEXITCODE."
    }
}

$frontendChoice = Read-Host "Create and Copy frontend image? (y/n)"
$migrationsChoice = Read-Host "Create and Copy migrations image? (y/n)"
$emailWorkerChoice = Read-Host "Create and Copy email_worker image? (y/n)"

if ($frontendChoice -eq 'y') {
    try {
        Set-Location "C:\code\javascript\fgs\frontend"
        Invoke-Step "docker build frontend" { docker build -t fgs_prod:latest . }
        Set-Location "C:\code\javascript\fgs"
        Invoke-Step "docker save frontend" { docker save fgs_prod:latest -o ./notes/tars/fgs_prod.tar }
        Invoke-Step "rclone copy frontend tar" { rclone copy .\notes\tars\fgs_prod.tar mgck:/home/badmagick/apps/docker_tars -P }
    }
    catch {
        Write-Host "Error in frontend build process: $_" -ForegroundColor Red
        Set-Location "C:\code\javascript\fgs"
        exit 1
    }
}

if ($migrationsChoice -eq 'y') {
    try {
        Set-Location "C:\code\javascript\fgs\frontend"
        Invoke-Step "docker build migrations" { docker build -f Dockerfile.migrations -t fgs_migrations:latest . }
        Set-Location "C:\code\javascript\fgs"
        Invoke-Step "docker save migrations" { docker save fgs_migrations:latest -o ./notes/tars/fgs_migrations.tar }
        Invoke-Step "rclone copy migrations tar" { rclone copy .\notes\tars\fgs_migrations.tar mgck:/home/badmagick/apps/docker_tars -P }
    }
    catch {
        Write-Host "Error in migrations build process: $_" -ForegroundColor Red
        Set-Location "C:\code\javascript\fgs"
        exit 1
    }
}

if ($emailWorkerChoice -eq 'y') {
    try {
        Set-Location "C:\code\javascript\fgs\email_worker"
        Invoke-Step "docker build email_worker" { docker build -t email_worker:latest . }
        Set-Location "C:\code\javascript\fgs"
        Invoke-Step "docker save email_worker" { docker save email_worker:latest -o ./notes/tars/email_worker.tar }
        Invoke-Step "rclone copy email_worker tar" { rclone copy .\notes\tars\email_worker.tar mgck:/home/badmagick/apps/docker_tars -P }
    }
    catch {
        Write-Host "Error in email_worker build process: $_" -ForegroundColor Red
        Set-Location "C:\code\javascript\fgs"
        exit 1
    }
}
