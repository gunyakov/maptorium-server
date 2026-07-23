Set-Location "C:\Maptorium\maptorium-server"
$env:Path = "C:\nvm4w\nodejs;" + $env:Path
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
npm run dist:win *>&1 | Tee-Object -FilePath "C:\Maptorium\maptorium-server\dist-win-build.log"
Write-Host "BUILD_EXIT_CODE=$LASTEXITCODE"
Read-Host "Press Enter to close"
