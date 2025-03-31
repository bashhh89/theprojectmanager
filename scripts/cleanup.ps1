# Get the current process ID
$currentPid = $PID

Write-Host "Starting cleanup process..."

# Get all node processes except the current one
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Id -ne $currentPid }

# Kill each process
foreach ($process in $nodeProcesses) {
    try {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        Write-Host "Terminated Node.js process: $($process.Id)"
    } catch {
        Write-Host "Could not terminate process: $($process.Id)"
    }
}

# Clean the .next directory if it exists
if (Test-Path ".next") {
    Remove-Item ".next" -Recurse -Force
    Write-Host "Cleaned .next directory"
}

Write-Host "Cleanup completed successfully"
# Use exit instead of [System.Environment]::Exit to allow command chaining
exit 0 