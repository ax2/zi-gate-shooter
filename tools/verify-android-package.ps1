param([ValidatePattern('^Stage-[0-9]{2}$')][string]$Stage = 'Stage-13')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$taskApk = Join-Path $taskRoot "build\releases\$Stage\android\zi-gate-shooter-debug.apk"
$taskSdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } elseif ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT } else { Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
$taskAapt = Join-Path $taskSdk 'build-tools\36.0.0\aapt.exe'
$taskPermissionLines = @(& $taskAapt dump permissions $taskApk)
if ($LASTEXITCODE -ne 0) { throw 'Cannot inspect final APK permissions.' }
$taskExpectedApp = (Get-Content -LiteralPath (Join-Path $taskRoot 'capacitor.config.json') -Raw | ConvertFrom-Json).appId
$taskAllowedPermission = $taskExpectedApp + '.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION'
$taskExpectedPermissions = @("package: $taskExpectedApp", "permission: $taskAllowedPermission", "uses-permission: name='$taskAllowedPermission'")
if (@(Compare-Object $taskExpectedPermissions $taskPermissionLines).Count) { throw 'Final APK declares unreviewed package/permissions.' }
function Get-StreamDigest($taskStream) {
    $taskAlgorithm = [Security.Cryptography.SHA256]::Create()
    try { return [BitConverter]::ToString($taskAlgorithm.ComputeHash($taskStream)).Replace('-','') }
    finally { $taskAlgorithm.Dispose() }
}
$taskZip = [IO.Compression.ZipFile]::OpenRead($taskApk)
try {
    $taskFiles = @(Get-ChildItem -LiteralPath (Join-Path $taskRoot 'build\android-web') -Recurse -File)
    foreach ($taskFile in $taskFiles) {
        $taskRelative = $taskFile.FullName.Substring((Join-Path $taskRoot 'build\android-web').Length + 1).Replace('\','/')
        $taskEntry = $taskZip.GetEntry('assets/public/' + $taskRelative)
        if (!$taskEntry) { throw "APK resource missing: $taskRelative" }
        $taskSourceStream = [IO.File]::OpenRead($taskFile.FullName)
        $taskEntryStream = $taskEntry.Open()
        try { if ((Get-StreamDigest $taskSourceStream) -ne (Get-StreamDigest $taskEntryStream)) { throw "APK resource differs: $taskRelative" } }
        finally { $taskSourceStream.Dispose(); $taskEntryStream.Dispose() }
    }
    # Capacitor sync adds these two empty compatibility stubs without Cordova plugins.
    $taskStubs = @('assets/public/cordova.js','assets/public/cordova_plugins.js')
    foreach ($taskStub in $taskStubs) {
        $taskStubEntry = $taskZip.GetEntry($taskStub)
        if (!$taskStubEntry -or $taskStubEntry.Length -ne 0) { throw "Unexpected Cordova payload: $taskStub" }
    }
    $taskPackaged = @($taskZip.Entries | Where-Object { $_.FullName.StartsWith('assets/public/') -and $_.Name -and $_.FullName -notin $taskStubs })
    if ($taskPackaged.Count -ne $taskFiles.Count) { throw 'APK contains unexpected public resources.' }
    $taskConfigReader = [IO.StreamReader]::new($taskZip.GetEntry('assets/capacitor.config.json').Open())
    try { $taskConfig = $taskConfigReader.ReadToEnd() | ConvertFrom-Json } finally { $taskConfigReader.Dispose() }
    if ($taskConfig.server) { throw 'APK must not depend on a server configuration.' }
    if ($taskConfig.plugins.SystemBars.style -ne 'DARK' -or $taskConfig.plugins.SystemBars.insetsHandling -ne 'css') { throw 'Native system-bar contract differs.' }
    $taskArtCheck = Join-Path $taskRoot 'build\native-art-check'
    New-Item -ItemType Directory -Path $taskArtCheck -Force | Out-Null
    $taskArtEntries = @()
    foreach ($taskDensity in @('mdpi','hdpi','xhdpi','xxhdpi','xxxhdpi')) {
        foreach ($taskName in @('ic_launcher.png','ic_launcher_foreground.png','ic_launcher_round.png')) {
            $taskMatches = @($taskZip.Entries | Where-Object { $_.FullName -match ('^res/mipmap-' + $taskDensity + '(-v[0-9]+)?/' + [regex]::Escape($taskName) + '$') })
            if ($taskMatches.Count -ne 1) { throw "Missing/ambiguous native icon: $taskDensity/$taskName" }
            $taskNativeCopy = Join-Path $taskArtCheck ($taskDensity + '-' + $taskName)
            [IO.Compression.ZipFileExtensions]::ExtractToFile($taskMatches[0], $taskNativeCopy, $true)
            $taskArtEntries += @{ name = "$taskDensity/$taskName"; source = Join-Path $taskRoot "android\app\src\main\res\mipmap-$taskDensity\$taskName"; packaged = $taskNativeCopy }
        }
    }
    $taskLaunch = $taskZip.GetEntry('res/drawable-nodpi-v4/launch_mark.png')
    if (!$taskLaunch) { $taskLaunch = $taskZip.GetEntry('res/drawable-nodpi/launch_mark.png') }
    if (!$taskLaunch) { throw 'Native launch artwork missing.' }
    $taskLaunchCopy = Join-Path $taskArtCheck 'launch_mark.png'
    [IO.Compression.ZipFileExtensions]::ExtractToFile($taskLaunch, $taskLaunchCopy, $true)
    $taskArtEntries += @{ name = 'launch_mark'; source = Join-Path $taskRoot 'android\app\src\main\res\drawable-nodpi\launch_mark.png'; packaged = $taskLaunchCopy }
    $taskArtManifest = Join-Path $taskArtCheck 'manifest.json'
    [IO.File]::WriteAllText($taskArtManifest, (ConvertTo-Json -InputObject $taskArtEntries))
    & node (Join-Path $PSScriptRoot 'verify-native-art.mjs') $taskArtManifest
    if ($LASTEXITCODE -ne 0) { throw 'Compiled native artwork validation failed.' }
    if (@($taskZip.Entries | Where-Object { $_.FullName -match '^res/.*/splash\.png$' }).Count) { throw 'Template splash asset remains packaged.' }
    $taskLegalReader = [IO.StreamReader]::new($taskZip.GetEntry('assets/public/legal/android-runtime.json').Open())
    try { $taskLegal = $taskLegalReader.ReadToEnd() | ConvertFrom-Json } finally { $taskLegalReader.Dispose() }
    $taskRecord = [ordered]@{ publicFiles = $taskFiles.Count; emptyCapacitorCompatibilityStubs = 2; allPublicFileHashesMatch = $true; nativeArtworkImages = $taskArtEntries.Count; nativeArtworkPixelsMatch = $true; systemBars = 'DARK/css'; templateSplashAssets = 0; serverConfiguration = $false; finalPermissions = @($taskAllowedPermission); debugRuntimeLicenseCoordinates = $taskLegal.configurations.debugRuntimeClasspath.modules.Count; releaseRuntimeLicenseCoordinates = $taskLegal.configurations.releaseRuntimeClasspath.modules.Count; nativeDeviceTest = $false }
    [IO.File]::WriteAllText((Join-Path $taskRoot "build\releases\$Stage\android\PACKAGE_CHECK.json"), ($taskRecord | ConvertTo-Json))
    Write-Output "APK local payload verified: $($taskFiles.Count) files. Native offline execution still requires device testing."
} finally { $taskZip.Dispose() }
