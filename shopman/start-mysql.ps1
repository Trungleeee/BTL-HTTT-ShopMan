param(
    [string]$DbConfig = (Join-Path $env:USERPROFILE 'shopman-db.properties'),
    [int]$Port = 8080,
    [switch]$NoBrowser
)
$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $DbConfig -PathType Leaf)) {
    throw "Không tìm thấy cấu hình MySQL: $DbConfig. Tạo tệp theo db.properties.example."
}
$runtime = Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot '.runtime') -Directory -Filter 'apache-tomcat-10.1.*' | Sort-Object Name -Descending | Select-Object -First 1
if (-not $runtime) { throw 'Chưa có Tomcat 10.1 trong thư mục .runtime.' }
$javaRoot = $env:JAVA_HOME
if (-not $javaRoot -or -not (Test-Path -LiteralPath (Join-Path $javaRoot 'bin/javac.exe'))) {
    $jdk = Get-ChildItem -LiteralPath 'C:\Program Files\Java' -Directory -Filter 'jdk-*' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $jdk) { throw 'Cần cài JDK 17 trở lên để chạy Tomcat.' }
    $javaRoot = $jdk.FullName
}
$address = "http://127.0.0.1:$Port/shopman/dang-nhap"
$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    $pidFile = Join-Path $runtime.FullName 'shopman.pid'
    if (-not (Test-Path -LiteralPath $pidFile) -or $listener.OwningProcess -notcontains [int](Get-Content -LiteralPath $pidFile)) {
        throw "Cổng $Port đang được ứng dụng khác sử dụng."
    }
    Write-Host "ShopMan đang chạy: $address"
    if (-not $NoBrowser) { Start-Process $address }
    return
}
$classes = Join-Path $PSScriptRoot 'build/classes'
New-Item -ItemType Directory -Path $classes -Force | Out-Null
$sourceFiles = Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot 'src/model'), (Join-Path $PSScriptRoot 'src/dao') -Recurse -Filter '*.java' | ForEach-Object { $_.FullName }
& (Join-Path $javaRoot 'bin/javac.exe') --release 8 -Xlint:-options -encoding UTF-8 -cp (Join-Path $PSScriptRoot 'WebContent/WEB-INF/lib/*') -d $classes @sourceFiles
if ($LASTEXITCODE -ne 0) { throw 'Biên dịch Java thất bại.' }
$deployment = Join-Path $runtime.FullName 'webapps/shopman'
New-Item -ItemType Directory -Path $deployment -Force | Out-Null
Copy-Item -Path (Join-Path $PSScriptRoot 'WebContent/*') -Destination $deployment -Recurse -Force
$webClasses = Join-Path $deployment 'WEB-INF/classes'
New-Item -ItemType Directory -Path $webClasses -Force | Out-Null
foreach ($package in 'model', 'dao') {
    Copy-Item -LiteralPath (Join-Path $classes $package) -Destination $webClasses -Recurse -Force
}
$serverXml = Join-Path $runtime.FullName 'conf/server.xml'
[xml]$server = Get-Content -LiteralPath $serverXml -Raw
$server.Server.SetAttribute('port', '-1')
$connector = $server.SelectSingleNode('//Connector[@protocol="HTTP/1.1"]')
$connector.SetAttribute('port', [string]$Port)
$connector.SetAttribute('address', '127.0.0.1')
$server.Save($serverXml)
$arguments = @(
    ('"-Dcatalina.home={0}"' -f $runtime.FullName),
    ('"-Dcatalina.base={0}"' -f $runtime.FullName),
    ('"-Djava.io.tmpdir={0}"' -f (Join-Path $runtime.FullName 'temp')),
    ('"-Dshopman.db.config={0}"' -f (Resolve-Path -LiteralPath $DbConfig).Path),
    '-Dfile.encoding=UTF-8', '-cp',
    ('"{0};{1}"' -f (Join-Path $runtime.FullName 'bin/bootstrap.jar'), (Join-Path $runtime.FullName 'bin/tomcat-juli.jar')),
    'org.apache.catalina.startup.Bootstrap', 'start'
)
$process = Start-Process -FilePath (Join-Path $javaRoot 'bin/java.exe') -ArgumentList $arguments -WorkingDirectory $runtime.FullName -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtime.FullName 'logs/shopman-out.log') -RedirectStandardError (Join-Path $runtime.FullName 'logs/shopman-error.log')
Set-Content -LiteralPath (Join-Path $runtime.FullName 'shopman.pid') -Value $process.Id
$ready = $false
for ($attempt = 0; $attempt -lt 40; $attempt++) {
    if ($process.HasExited) { throw 'Tomcat không khởi động được. Xem .runtime/apache-tomcat-*/logs/shopman-error.log.' }
    try {
        $result = Invoke-WebRequest -Uri $address -UseBasicParsing -TimeoutSec 3
        if ($result.StatusCode -eq 200) { $ready = $true; break }
    } catch { Start-Sleep -Milliseconds 500 }
}
if (-not $ready) { throw 'Tomcat chưa sẵn sàng. Kiểm tra nhật ký trong .runtime/apache-tomcat-*/logs.' }
Write-Host "ShopMan + MySQL: $address"
if (-not $NoBrowser) { Start-Process $address }
