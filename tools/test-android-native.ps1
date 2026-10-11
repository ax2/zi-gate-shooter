param(
    [Parameter(Mandatory=$true)][ValidatePattern('^emulator-[0-9]+$')][string]$Serial,
    [ValidatePattern('^Stage-[0-9]{2}$')][string]$Stage = 'Stage-06'
)
$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$taskSdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
$taskAdb = Join-Path $taskSdk 'platform-tools\adb.exe'
$taskQemu = (& $taskAdb -s $Serial shell getprop ro.kernel.qemu).Trim()
if ($LASTEXITCODE -ne 0 -or $taskQemu -ne '1') { throw 'This runner requires an already booted, isolated Android emulator.' }
$taskBoot = (& $taskAdb -s $Serial shell getprop sys.boot_completed).Trim()
if ($taskBoot -ne '1') { throw 'Emulator has not completed booting.' }
$taskRun = Get-Date -Format 'yyyyMMdd-HHmmss'
$taskOutput = Join-Path $taskRoot "build\evidence\$Stage\native\$taskRun"
New-Item -ItemType Directory -Force -Path $taskOutput | Out-Null
$taskOldOptions = $env:JAVA_TOOL_OPTIONS
try {
    if ($env:HTTPS_PROXY) {
        $taskProxy = [Uri]$env:HTTPS_PROXY
        if ($taskProxy.UserInfo) { throw 'Authenticated proxy must be configured locally without credentials in command arguments.' }
        $env:JAVA_TOOL_OPTIONS = "$taskOldOptions -Dhttps.proxyHost=$($taskProxy.Host) -Dhttps.proxyPort=$($taskProxy.Port) -Dhttp.proxyHost=$($taskProxy.Host) -Dhttp.proxyPort=$($taskProxy.Port)"
    }
    Push-Location (Join-Path $taskRoot 'android')
    try {
        & .\gradlew.bat --no-daemon --console=plain :app:assembleDebug :app:assembleDebugAndroidTest *> (Join-Path $taskOutput 'build.txt')
        if ($LASTEXITCODE -ne 0) { throw "Native test build failed. See $taskOutput" }
    } finally { Pop-Location }
    $taskApp = Join-Path $taskRoot 'android\app\build\outputs\apk\debug\app-debug.apk'
    $taskTests = Join-Path $taskRoot 'android\app\build\outputs\apk\androidTest\debug\app-debug-androidTest.apk'
    foreach ($taskApk in @($taskApp, $taskTests)) {
        & $taskAdb -s $Serial install -r $taskApk
        if ($LASTEXITCODE -ne 0) { throw 'APK installation failed.' }
    }
    $taskFacts = [ordered]@{ serial = $Serial; emulator = $true; stage = $Stage;
        appSha256 = (Get-FileHash -LiteralPath $taskApp -Algorithm SHA256).Hash;
        testSha256 = (Get-FileHash -LiteralPath $taskTests -Algorithm SHA256).Hash;
        api = (& $taskAdb -s $Serial shell getprop ro.build.version.sdk).Trim();
        fingerprint = (& $taskAdb -s $Serial shell getprop ro.build.fingerprint).Trim();
        screen = (& $taskAdb -s $Serial shell wm size) -join "`n";
        density = (& $taskAdb -s $Serial shell wm density) -join "`n";
        physicalDeviceAcceptance = $false; offlineModeVerified = $false }
    $taskFacts | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $taskOutput 'device.json') -Encoding utf8
    & $taskAdb -s $Serial shell dumpsys webviewupdate | Set-Content -LiteralPath (Join-Path $taskOutput 'webview.txt') -Encoding utf8
    & $taskAdb -s $Serial shell am instrument -w -r -e class com.ax2.zigateshooter.NativeFlowTest com.ax2.zigateshooter.test/androidx.test.runner.AndroidJUnitRunner *> (Join-Path $taskOutput 'instrumentation.txt')
    $taskExit = $LASTEXITCODE
    $taskResult = Get-Content -LiteralPath (Join-Path $taskOutput 'instrumentation.txt') -Raw
    Write-Output $taskResult
    if ($taskExit -ne 0 -or $taskResult -notmatch 'OK \(2 tests\)' -or $taskResult -match 'FAILURES!!!|INSTRUMENTATION_FAILED') {
        throw "Native tests did not pass. See $taskOutput"
    }
    Write-Output "Native emulator checks passed. Evidence: $taskOutput"
} finally { $env:JAVA_TOOL_OPTIONS = $taskOldOptions }
