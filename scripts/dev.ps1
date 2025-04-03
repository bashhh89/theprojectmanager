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

# Function to find an available port
function Find-AvailablePort {
    param(
        [int]$StartPort = 3000,
        [int]$EndPort = 3999
    )
    
    for ($port = $StartPort; $port -le $EndPort; $port++) {
        if (-not (Test-PortInUse -port $port)) {
            return $port
        }
    }
    
    # If no port is available, return 0 to let Node pick a random one
    return 0
}

# Error handling
$ErrorActionPreference = "Stop"
try {
    # Kill existing Node.js processes
    Write-Status -Status "INFO" -Message "🔄 Cleaning up existing Node.js processes..." -Color Cyan
    taskkill /F /IM node.exe 2>$null
    if ($LASTEXITCODE -ne 0) { 
        Write-Status -Status "INFO" -Message "No Node.js processes found to clean up." -Color Yellow
    }

    # Wait a moment to ensure ports are freed
    Start-Sleep -Seconds 1

    # Find an available port
    $port = Find-AvailablePort
    if ($port -eq 0) {
        Write-Status -Status "WARNING" -Message "No specific port available in the range. Letting Next.js choose a random port." -Color Yellow
        # Start Next.js with a random port
        Write-Status -Status "INFO" -Message "🚀 Starting Next.js on a random available port..." -Color Green
        cross-env NODE_OPTIONS=--max_old_space_size=4096 next dev --port 0
    } else {
        # Start Next.js on the found port
        Write-Status -Status "INFO" -Message "🚀 Starting Next.js on port $port..." -Color Green
        cross-env NODE_OPTIONS=--max_old_space_size=4096 next dev -p $port
    }
}
catch {
    Write-Status -Status "ERROR" -Message $_.Exception.Message -Color Red
    exit 1
} 