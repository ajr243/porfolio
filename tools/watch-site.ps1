param([switch]$Once)
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $repo
$mutex = New-Object Threading.Mutex($false, 'Local\AndrewPortfolioAutoPublish')
if (!$mutex.WaitOne(0)) { exit }
$state = Join-Path $repo '.local'
New-Item -ItemType Directory -Path $state -Force | Out-Null
$log = Join-Path $state 'auto-publish.log'
function Log($message) { Add-Content -LiteralPath $log -Value "$(Get-Date -Format o) $message" }
$paths = @('index.html','styles.css','script.js','about-me.html','contacts.html','projects.html','skills.html','assets')
$previous = ''; $changedAt = Get-Date
function GitRun([string[]]$Arguments) {
  $ErrorActionPreference = 'Continue'
  $result = & git @Arguments 2>&1
  if ($LASTEXITCODE -ne 0) { throw ($result -join "`n") }
  return ($result | Where-Object { $_ -isnot [System.Management.Automation.ErrorRecord] })
}
try {
  Log 'Watcher started. Publishes tracked production files after 15 seconds without changes.'
  do {
    try {
      if ((GitRun @('branch','--show-current')) -ne 'main') { throw 'Watcher paused: current branch is not main.' }
      $staged = GitRun @('diff','--cached','--name-only')
      if ($staged) { if ($Once) { break }; Start-Sleep -Seconds 5; continue }
      $changes = @(GitRun (@('diff','--name-only','--') + $paths))
      if ($changes.Count -gt 0) {
        $diff = (GitRun (@('diff','--binary','--') + $paths)) -join "`n"
        $sha = [Security.Cryptography.SHA256]::Create()
        try { $signature = [Convert]::ToBase64String($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($diff))) } finally { $sha.Dispose() }
        if ($signature -ne $previous) { $previous = $signature; $changedAt = Get-Date }
        if (!$Once -and ((Get-Date) - $changedAt).TotalSeconds -ge 15) {
          GitRun (@('add','--') + $changes) | Out-Null
          GitRun @('diff','--cached','--check') | Out-Null
          GitRun @('commit','-m','Update portfolio from saved editor changes') | Out-Null
          Log ('Committed: ' + ($changes -join ', '))
          $previous = ''
        }
      } else { $previous = '' }
      $ahead = GitRun @('rev-list','--count','origin/main..HEAD')
      if (!$Once -and [int]$ahead -gt 0) { GitRun @('push','origin','main') | Out-Null; Log 'Pushed main; GitHub Pages will redeploy.' }
      if ($Once) { Log ('Check complete. Changed tracked production files: ' + $changes.Count); break }
    } catch { Log $_.Exception.Message; if ($Once) { throw }; Start-Sleep -Seconds 20 }
    Start-Sleep -Seconds 5
  } while (!$Once)
} finally { $mutex.ReleaseMutex(); $mutex.Dispose() }
