param(
    [ValidateRange(1,65535)][int]$Port = 8080,
    [switch]$LocalOnly,
    [switch]$Rehearsal,
    [switch]$Test
)
$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
$keys = @('HALL_OMAR','HALL_BIND','HALL_PORT','HALL_DATA')
$old = @{}
foreach ($key in $keys) { $old[$key] = [Environment]::GetEnvironmentVariable($key,'Process') }
try {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        throw 'Node.js 20+ is required. Install it before going offline.'
    }
    $version = (& node --version)
    if ($LASTEXITCODE -ne 0 -or [int]($version.TrimStart('v').Split('.')[0]) -lt 20) {
        throw 'Node.js 20+ is required.'
    }
    if ($Test) {
        & node --test scripts/poll.test.mjs
        if ($LASTEXITCODE -ne 0) { throw 'Poll tests failed.' }
        return
    }
    $secure = Read-Host 'Presenter password (at least 10 characters)' -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { $env:HALL_OMAR = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr); $secure.Dispose() }
    if ($env:HALL_OMAR.Length -lt 10) { throw 'Choose a password with at least 10 characters.' }
    $env:HALL_BIND = if ($LocalOnly) { '127.0.0.1' } else { '0.0.0.0' }
    $env:HALL_PORT = [string]$Port
    if ($Rehearsal) { $env:HALL_DATA = Join-Path $PSScriptRoot 'hall-rehearsal.json' }
    elseif (-not $env:HALL_DATA) { $env:HALL_DATA = Join-Path $PSScriptRoot 'hall-data.json' }
    Write-Host ''
    Write-Host "Studio:    http://127.0.0.1:${Port}/?view=studio"
    Write-Host "Projector: http://127.0.0.1:${Port}/?view=projector"
    Write-Host "QR setup:  http://127.0.0.1:${Port}/join"
    Write-Host "Data:      $env:HALL_DATA"
    if (-not $LocalOnly) {
        Write-Host 'Possible audience addresses (choose the MF296C adapter IPv4):'
        Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
          Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' -and $_.AddressState -eq 'Preferred' } |
          ForEach-Object { Write-Host "  $($_.InterfaceAlias): http://$($_.IPAddress):${Port}/" }
    }
    Write-Host 'Keep this window open. Ctrl+C stops the server.'
    & node server.mjs
    if ($LASTEXITCODE -ne 0) { throw "Hall Live exited with code $LASTEXITCODE." }
} finally {
    foreach ($key in $keys) { [Environment]::SetEnvironmentVariable($key,$old[$key],'Process') }
    Pop-Location
}
