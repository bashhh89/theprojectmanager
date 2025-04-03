# Next.js Development Server Port Finder
# This script finds an available port and starts the Next.js development server
# It also cleans up any existing Node.js processes that might be using ports

function Write-Info($message) {
    $timestamp = Get-Date -Format "[HH:mm:ss]"
    Write-Host "$timestamp INFO $message" -ForegroundColor Cyan
}

function Write-Success($message) {
    $timestamp = Get-Date -Format "[HH:mm:ss]"
    Write-Host "$timestamp SUCCESS $message" -ForegroundColor Green
}

function Write-Error($message) {
    $timestamp = Get-Date -Format "[HH:mm:ss]"
    Write-Host "$timestamp ERROR $message" -ForegroundColor Red
}

Write-Host "💫 Next.js Development Server Launcher" -ForegroundColor Magenta

# Kill all Node.js processes to free up ports
function KillNodeProcesses {
    Write-Info "Cleaning up existing Node.js processes..."
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    $count = 0
    
    if ($nodeProcesses) {
        foreach ($process in $nodeProcesses) {
            Write-Info "Terminated Node.js process with PID $($process.Id)"
            Stop-Process -Id $process.Id -Force
            $count++
        }
        Write-Success "Terminated $count Node.js processes"
    } else {
        Write-Info "No Node.js processes found to terminate"
    }
}

# Check if a port is available
function Test-PortAvailable {
    param(
        [int]$Port
    )
    
    try {
        $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, $Port)
        $listener.Start()
        $listener.Stop()
        return $true
    }
    catch {
        return $false
    }
}

# Find an available port
function Find-AvailablePort {
    param(
        [int]$StartPort = 3000,
        [int]$EndPort = 3099
    )
    
    Write-Info "Finding available port..."
    
    # First try the preferred ports
    $preferredPorts = @(3000, 3001, 3002, 3003, 3004, 3005)
    
    foreach ($port in $preferredPorts) {
        if (Test-PortAvailable -Port $port) {
            Write-Success "Found available preferred port: $port"
            return $port
        }
    }
    
    # If preferred ports are not available, scan the range
    for ($port = $StartPort; $port -le $EndPort; $port++) {
        if (Test-PortAvailable -Port $port) {
            Write-Success "Found available port in range: $port"
            return $port
        }
    }
    
    # If no ports in range are available, try a random high port
    $randomPort = Get-Random -Minimum 10000 -Maximum 65535
    Write-Warning "No ports available in preferred range, using random port: $randomPort"
    return $randomPort
}

# Execute steps
KillNodeProcesses
$port = Find-AvailablePort

Write-Info "Starting Next.js on port $port..."
$env:NODE_OPTIONS="--max_old_space_size=4096"
npx next dev -p $port
