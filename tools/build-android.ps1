param([ValidatePattern('^Stage-[0-9]{2}$')][string]$Stage = 'Stage-22')
$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$taskSdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } elseif ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT } else { Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
if (!(Test-Path -LiteralPath (Join-Path $taskSdk 'platforms\android-36\android.jar'))) { throw 'Android SDK 36 is required; configure ANDROID_HOME locally.' }
$taskAndroid = Join-Path $taskRoot 'android'
[IO.File]::WriteAllText((Join-Path $taskAndroid 'local.properties'), ('sdk.dir=' + $taskSdk.Replace('\','/').Replace(':','\:')))
$taskOldJavaOptions = $env:JAVA_TOOL_OPTIONS
try {
    if ($env:HTTPS_PROXY) {
        $taskProxy = [Uri]$env:HTTPS_PROXY
        if ($taskProxy.UserInfo) { throw 'Authenticated proxy must be configured locally without exposing credentials in build arguments.' }
        $env:JAVA_TOOL_OPTIONS = "$taskOldJavaOptions -Dhttps.proxyHost=$($taskProxy.Host) -Dhttps.proxyPort=$($taskProxy.Port) -Dhttp.proxyHost=$($taskProxy.Host) -Dhttp.proxyPort=$($taskProxy.Port)"
    }
    Push-Location $taskAndroid
    try {
        & .\gradlew.bat --no-daemon --console=plain assembleDebug lintDebug
        if ($LASTEXITCODE -ne 0) { throw 'Android Gradle build or lint failed.' }
    } finally { Pop-Location }
    $taskApk = Join-Path $taskAndroid 'app\build\outputs\apk\debug\app-debug.apk'
    $taskSigner = Join-Path $taskSdk 'build-tools\36.0.0\apksigner.bat'
    & $taskSigner verify $taskApk
    if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed.' }
    $taskOutput = Join-Path $taskRoot "build\releases\$Stage\android"
    New-Item -ItemType Directory -Path $taskOutput -Force | Out-Null
    Copy-Item -LiteralPath $taskApk -Destination (Join-Path $taskOutput 'zi-gate-shooter-debug.apk') -Force
    $taskHashAlgorithm = [Security.Cryptography.SHA256]::Create()
    $taskApkStream = [IO.File]::OpenRead($taskApk)
    try { $taskHash = [BitConverter]::ToString($taskHashAlgorithm.ComputeHash($taskApkStream)).Replace('-','') }
    finally { $taskApkStream.Dispose(); $taskHashAlgorithm.Dispose() }
    $taskRecord = [ordered]@{ stage = $Stage; artifact = 'zi-gate-shooter-debug.apk'; bytes = (Get-Item -LiteralPath $taskApk).Length; sha256 = $taskHash; signatureVerified = $true; signing = 'Android development debug key'; deviceVerified = $false; storeSubmitted = $false }
    [IO.File]::WriteAllText((Join-Path $taskOutput 'BUILD_RECORD.json'), ($taskRecord | ConvertTo-Json))
    & (Join-Path $PSScriptRoot 'verify-android-package.ps1') -Stage $Stage
    Write-Output "Android development APK saved: $taskOutput"
} finally { $env:JAVA_TOOL_OPTIONS = $taskOldJavaOptions }
