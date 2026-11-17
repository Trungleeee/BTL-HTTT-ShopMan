$ErrorActionPreference = 'Stop'
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$nodePath = if ($nodeCommand) { $nodeCommand.Source } else { $null }
if (-not $nodePath) {
    $runtimeRoot = Join-Path $env:ProgramFiles 'WindowsApps'
    $runtimes = Get-ChildItem -LiteralPath $runtimeRoot -Directory -Filter 'OpenAI.CodexPrimaryRuntime*' -ErrorAction SilentlyContinue | Sort-Object Name -Descending
    foreach ($runtime in $runtimes) {
        $candidate = Join-Path $runtime.FullName 'dependencies\node\bin\node.exe'
        if (Test-Path -LiteralPath $candidate) { $nodePath = $candidate; break }
    }
}
if (-not $nodePath) { throw 'Không tìm thấy Node.js. Hãy cài Node.js 18 trở lên rồi chạy lại.' }
& $nodePath (Join-Path $PSScriptRoot 'preview.mjs')
