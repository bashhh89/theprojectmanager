# Kill Node.js Processes Script
# This script terminates all running Node.js processes to free up ports

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Info($message) {
    Write-Host $message -ForegroundColor Cyan
}

function Write-Success($message) {
    Write-Host $message -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host $message -ForegroundColor Yellow
}

Write-Info "Cleaning up existing Node.js processes..."
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
$count = 0

if ($nodeProcesses) {
    foreach ($process in $nodeProcesses) {
        Write-Info "Terminating Node.js process with PID $($process.Id)"
        Stop-Process -Id $process.Id -Force
        $count++
    }
    Write-Success "Successfully terminated $count Node.js processes"
} else {
    Write-Warning "No Node.js processes found to terminate"
}

# Exit with success code regardless of whether we found processes to kill
exit 0
