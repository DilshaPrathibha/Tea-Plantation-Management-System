param(
    [string]$Domain,
    [int]$Port
)

Write-Host "=== Ngrok Tunnel Startup Script ===" -ForegroundColor Green

# Load environment variables from BACKEND\.env if it exists
$envFile = "BACKEND\.env"
if (Test-Path $envFile) {
    Write-Host "Loading environment variables from $envFile..." -ForegroundColor Yellow
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]*)\s*=\s*(.*)\s*$") {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            # Remove quotes if present
            $value = $value -replace '^["\']|["\']$', ''
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
            Write-Host "  Set $key = $value" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "No $envFile found, using defaults and parameters" -ForegroundColor Yellow
}

# Set PORT from environment or parameter or default
if ($Port -eq 0) {
    $Port = [Environment]::GetEnvironmentVariable("PORT")
    if (-not $Port) {
        $Port = 5001
    }
}
Write-Host "Using PORT: $Port" -ForegroundColor Green

# Set DOMAIN from parameter or environment variable
if (-not $Domain) {
    $Domain = [Environment]::GetEnvironmentVariable("NGROK_DOMAIN")
}

if (-not $Domain) {
    Write-Error "NGROK_DOMAIN is required. Provide it via:"
    Write-Host "  1. Parameter: -Domain 'your-domain.ngrok-free.app'" -ForegroundColor Yellow
    Write-Host "  2. Environment variable in BACKEND\.env: NGROK_DOMAIN=your-domain.ngrok-free.app" -ForegroundColor Yellow
    exit 1
}

Write-Host "Using DOMAIN: $Domain" -ForegroundColor Green

# Detect ngrok executable
$ngrokPath = $null

# First try: ngrok in PATH
try {
    $ngrokVersion = & ngrok version 2>$null
    if ($LASTEXITCODE -eq 0) {
        $ngrokPath = "ngrok"
        Write-Host "✓ Found ngrok in PATH: $ngrokVersion" -ForegroundColor Green
    }
} catch {
    # ngrok not in PATH
}

# Second try: local ngrok.exe
if (-not $ngrokPath) {
    $localNgrok = "ngrok.exe"
    if (Test-Path $localNgrok) {
        try {
            $ngrokVersion = & ".\$localNgrok" version 2>$null
            if ($LASTEXITCODE -eq 0) {
                $ngrokPath = ".\$localNgrok"
                Write-Host "✓ Found local ngrok: $ngrokVersion" -ForegroundColor Green
            }
        } catch {
            # Local ngrok.exe not working
        }
    }
}

# Third try: check parent directory for ngrok.exe
if (-not $ngrokPath) {
    $parentNgrok = "..\ngrok.exe"
    if (Test-Path $parentNgrok) {
        try {
            $ngrokVersion = & $parentNgrok version 2>$null
            if ($LASTEXITCODE -eq 0) {
                $ngrokPath = $parentNgrok
                Write-Host "✓ Found ngrok in parent directory: $ngrokVersion" -ForegroundColor Green
            }
        } catch {
            # Parent ngrok.exe not working
        }
    }
}

if (-not $ngrokPath) {
    Write-Error "Ngrok not found. Please install ngrok:"
    Write-Host "  1. Download from: https://ngrok.com/download" -ForegroundColor Yellow
    Write-Host "  2. Or install via: winget install ngrok" -ForegroundColor Yellow
    Write-Host "  3. Or place ngrok.exe in current directory" -ForegroundColor Yellow
    exit 1
}

# Start ngrok tunnel
Write-Host "`nStarting ngrok tunnel..." -ForegroundColor Green
Write-Host "Command: $ngrokPath http --domain=$Domain $Port" -ForegroundColor Gray
Write-Host "Press Ctrl+C to stop the tunnel" -ForegroundColor Yellow
Write-Host ""

try {
    & $ngrokPath http --domain=$Domain $Port
} catch {
    Write-Error "Failed to start ngrok: $_"
    exit 1
}