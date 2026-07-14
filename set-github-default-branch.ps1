$repo = "ezbillify/EZ-Workspace"
Write-Host "current local branch:" (git branch --show-current)
Write-Host "current remote HEAD before:"
git ls-remote --symref origin HEAD
$body = @{ default_branch = "main" } | ConvertTo-Json
$headers = @{ Authorization = "token $env:GITHUB_TOKEN"; Accept = 'application/vnd.github+json' }
$response = Invoke-RestMethod -Headers $headers -Method Patch -Uri "https://api.github.com/repos/$repo" -Body $body -ContentType 'application/json'
Write-Host "patched default_branch=" $response.default_branch
Write-Host "setting local remote HEAD to auto"
git remote set-head origin --auto
Write-Host "current remote HEAD after:"
git ls-remote --symref origin HEAD
