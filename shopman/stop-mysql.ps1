$ErrorActionPreference = 'Stop'
$runtimes = Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot '.runtime') -Directory -Filter 'apache-tomcat-10.1.*'
foreach ($runtime in $runtimes) {
    $pidFile = Join-Path $runtime.FullName 'shopman.pid'
    if (-not (Test-Path -LiteralPath $pidFile)) { continue }
    $serverProcessId = [int](Get-Content -LiteralPath $pidFile)
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $serverProcessId"
    if ($process -and $process.Name -eq 'java.exe' -and $process.CommandLine.Contains($runtime.FullName) -and $process.CommandLine.Contains('org.apache.catalina.startup.Bootstrap')) {
        Stop-Process -Id $serverProcessId
        Write-Host 'Đã dừng Tomcat của ShopMan.'
    }
    Remove-Item -LiteralPath $pidFile
}
