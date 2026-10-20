param(
    [ValidateSet('Debug','Release')][string]$Configuration = 'Debug',
    [string]$SigningConfig,
    [switch]$Offline
)
$ErrorActionPreference = 'Stop'
if (-not $env:JAVA_HOME) {
    $bundledJbr = 'C:\Program Files\Android\Android Studio\jbr'
    if (Test-Path -LiteralPath $bundledJbr) { $env:JAVA_HOME = $bundledJbr }
}
if (-not $env:ANDROID_HOME) { $env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
if ($Configuration -eq 'Release') {
    if (-not $SigningConfig) { throw 'Release requires -SigningConfig with a private JSON file outside the source folder. See README-fa.md.' }
    $signing = Get-Content -LiteralPath $SigningConfig -Raw | ConvertFrom-Json
    if (-not (Test-Path -LiteralPath $signing.keystore)) { throw 'Signing keystore does not exist.' }
    $env:DAFTAR_KEYSTORE = $signing.keystore
    $env:DAFTAR_STORE_PASSWORD = $signing.storePassword
    $env:DAFTAR_KEY_PASSWORD = $signing.keyPassword
}
try {
    Push-Location $PSScriptRoot
    $buildArguments = @(':app:testDebugUnitTest', ':app:lintRelease', ":app:assemble$Configuration", '--no-daemon', '--max-workers=1')
    if ($Offline) { $buildArguments += '--offline' }
    & .\gradlew.bat @buildArguments
    if ($LASTEXITCODE -ne 0) { throw "Gradle failed with exit code $LASTEXITCODE" }
} finally {
    Pop-Location
    Remove-Item Env:\DAFTAR_KEYSTORE -ErrorAction SilentlyContinue
    Remove-Item Env:\DAFTAR_STORE_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:\DAFTAR_KEY_PASSWORD -ErrorAction SilentlyContinue
}
