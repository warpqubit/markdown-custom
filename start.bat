@echo off
title Markdown Custom v1.0
echo.
echo  ==========================================
echo   Markdown Custom v1.0 — Skill Manager
echo  ==========================================
echo.
echo  Iniciando servidor en http://localhost:3000
echo  Presiona Ctrl+C para detener.
echo.

:: Abrir el navegador después de 2 segundos (en background via PowerShell)
powershell -NoProfile -WindowStyle Hidden -Command ^
  "Start-Sleep 2; " ^
  "$chrome = @(" ^
  "  '%ProgramFiles%\Google\Chrome\Application\chrome.exe'," ^
  "  '%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe'," ^
  "  '%LocalAppData%\Google\Chrome\Application\chrome.exe'" ^
  "); " ^
  "$edge = @(" ^
  "  '%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe'," ^
  "  '%ProgramFiles%\Microsoft\Edge\Application\msedge.exe'" ^
  "); " ^
  "$opened = $false; " ^
  "foreach($p in $chrome){ if(Test-Path $p){ Start-Process $p 'http://localhost:3000'; $opened=$true; break }}; " ^
  "if(!$opened){ foreach($p in $edge){ if(Test-Path $p){ Start-Process $p 'http://localhost:3000'; $opened=$true; break }}}; " ^
  "if(!$opened){ Start-Process 'http://localhost:3000' }" &

:: Iniciar el servidor (proceso principal, bloqueante)
npx serve . -l 3000

pause
