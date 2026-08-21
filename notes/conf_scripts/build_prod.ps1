param(
    [string]$Tag = "",
    [int]$KeepLocalImages = 1
)

$ErrorActionPreference = "Stop"

$ImageRepositories = @(
    "fgs_prod",
    "email_worker",
    "fgs_migrations"
)
$RcloneRemote = "mgck"
$SshHost = "mgck"
$RemoteArchiveDirectory = "/home/badmagick/apps/docker_tars"
$RemoteLoader = "/home/badmagick/scripts/load-fgs-release.sh"
$ImageTagVariable = "FGS_IMAGE_TAG"
$LocalTarDirectory = [System.IO.Path]::GetFullPath(
    (Join-Path $PSScriptRoot "..\\tars")
)

function Invoke-Checked {
    param(
        [Parameter(Mandatory = $true)]
        [scriptblock]$Command,
        [Parameter(Mandatory = $true)]
        [string]$FailureMessage
    )

    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw $FailureMessage
    }
}

function Test-ImageInUse {
    param([Parameter(Mandatory = $true)][string]$ImageReference)

    $containers = docker container ls --all --quiet --filter "ancestor=$ImageReference"
    if ($LASTEXITCODE -ne 0) {
        throw "Could not inspect containers using $ImageReference."
    }

    return -not [string]::IsNullOrWhiteSpace(($containers -join ""))
}

function Clear-OldLocalImages {
    foreach ($imageRepository in $ImageRepositories) {
        try {
            $imageRows = docker image ls $imageRepository --format '{{.Repository}}|{{.Tag}}'
            if ($LASTEXITCODE -ne 0) {
                throw "Could not list local $imageRepository images."
            }

            $images = foreach ($row in $imageRows) {
                $repository, $imageTag = $row -split '\|', 2
                if ($imageTag -notmatch '^[0-9a-f]{12}$') {
                    continue
                }

                $reference = "${repository}:${imageTag}"
                $createdAtText = docker image inspect --format '{{.Created}}' $reference
                if ($LASTEXITCODE -ne 0) {
                    Write-Warning "Could not inspect $reference. It has been retained."
                    continue
                }

                [pscustomobject]@{
                    Tag = $imageTag
                    CreatedAt = [datetimeoffset]::Parse(
                        $createdAtText.Trim(),
                        [System.Globalization.CultureInfo]::InvariantCulture,
                        [System.Globalization.DateTimeStyles]::RoundtripKind
                    )
                }
            }

            $images = $images | Sort-Object CreatedAt -Descending

            foreach ($image in @($images | Select-Object -Skip $KeepLocalImages)) {
                $reference = "${imageRepository}:$($image.Tag)"

                if (Test-ImageInUse $reference) {
                    Write-Warning "Keeping $reference because a container references it."
                    continue
                }

                docker image rm $reference
                if ($LASTEXITCODE -ne 0) {
                    Write-Warning "Docker would not remove $reference. It has been retained."
                }
            }
        }
        catch {
            Write-Warning "Local cleanup for $imageRepository was skipped: $_"
        }
    }
}

$workingTreeStatus = git status --porcelain
if ($LASTEXITCODE -ne 0) {
    throw "Could not inspect the Git working tree."
}

if (-not [string]::IsNullOrWhiteSpace(($workingTreeStatus -join ""))) {
    throw "The Git working tree is not clean. Commit or stash changes before building."
}

if ([string]::IsNullOrWhiteSpace($Tag)) {
    $Tag = (git rev-parse --short=12 HEAD).Trim()
    if ($LASTEXITCODE -ne 0) {
        throw "Could not derive the image tag from Git."
    }
}

if ($Tag -notmatch '^[0-9a-f]{12}$') {
    throw "The image tag must be a 12-character lowercase hexadecimal Git commit."
}

$imageReferences = $ImageRepositories | ForEach-Object { "${_}:${Tag}" }
$tarName = "fgs-${Tag}.tar"
$localTarPath = Join-Path $LocalTarDirectory $tarName
$remoteTarPath = "${RemoteArchiveDirectory}/${tarName}"

New-Item -ItemType Directory -Force -Path $LocalTarDirectory | Out-Null

Invoke-Checked {
    docker build --pull --platform linux/amd64 --tag "fgs_prod:${Tag}" ./frontend
} "Frontend Docker build failed."

Invoke-Checked {
    docker build --pull --platform linux/amd64 --tag "email_worker:${Tag}" ./email_worker
} "Email worker Docker build failed."

Invoke-Checked {
    docker build --pull --platform linux/amd64 --file ./frontend/Dockerfile.migrations --tag "fgs_migrations:${Tag}" ./frontend
} "Migrations Docker build failed."

Invoke-Checked {
    docker image save --output $localTarPath $imageReferences
} "Docker image export failed."

Invoke-Checked {
    rclone copyto $localTarPath "${RcloneRemote}:${remoteTarPath}"
} "Uploading the image tarball failed. The local tarball has been retained."

Invoke-Checked {
    ssh $SshHost $RemoteLoader $remoteTarPath $Tag
} "The VPS did not load and verify the image. The local tarball has been retained."

Remove-Item -LiteralPath $localTarPath
Clear-OldLocalImages

Write-Host ""
Write-Host "Set this in Dokploy before redeploying:"
Write-Host "${ImageTagVariable}=${Tag}"
