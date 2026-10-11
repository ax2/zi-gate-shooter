$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$taskApk = Join-Path $taskRoot 'build\releases\Stage-02\android\zi-gate-shooter-debug.apk'
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
    $taskRecord = [ordered]@{ publicFiles = $taskFiles.Count; emptyCapacitorCompatibilityStubs = 2; allPublicFileHashesMatch = $true; serverConfiguration = $false; nativeDeviceTest = $false }
    [IO.File]::WriteAllText((Join-Path $taskRoot 'build\releases\Stage-02\android\PACKAGE_CHECK.json'), ($taskRecord | ConvertTo-Json))
    Write-Output "APK local payload verified: $($taskFiles.Count) files. Native offline execution still requires device testing."
} finally { $taskZip.Dispose() }
