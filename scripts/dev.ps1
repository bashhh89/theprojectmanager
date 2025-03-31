# Set output encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Function to write status messages
function Write-Status {
    param(
        [string]$Message,
        [string]$Status = "INFO",
        [string]$Color = "White"
    )
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $Status " -NoNewline -ForegroundColor $Color
    Write-Host $Message
}

# Function to check if a port is in use
function Test-PortInUse {
    param($port)
    $listener = $null
    try {
        $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, $port)
        $listener.Start()
        return $false
    }
    catch {
        return $true
    }
    finally {
        if ($listener) {
            $listener.Stop()
        }
    }
}

# Error handling
$ErrorActionPreference = "Stop"
try {
    # Kill existing Node.js processes
    Write-Host "🔄 Cleaning up existing Node.js processes..."
    taskkill /F /IM node.exe 2>$null
    if ($LASTEXITCODE -ne 0) { 
        Write-Host "No Node.js processes found to clean up."
    }

    # Wait a moment to ensure ports are freed
    Start-Sleep -Seconds 1

    # Start Next.js on port 3002
    Write-Host "🚀 Starting Next.js on port 3002..."
    npm run dev
}
catch {
    Write-Status -Status "ERROR" -Message $_.Exception.Message -Color Red
    exit 1
} 