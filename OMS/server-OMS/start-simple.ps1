Set-Location "d:\OMS\OMS\OMS\server-OMS"
Write-Host "Current directory: $(Get-Location)"
Write-Host "Starting simple server..."
node simple-server.js
