@echo off
title SaludPublica Connect - Inicio
echo Levantando base de datos y Redis (Docker)...
cd /d "C:\Users\migue\OneDrive\Documentos\SaludPublicaConnect"
docker compose up -d
echo.
echo Abriendo el backend en una ventana nueva (puerto 3001)...
start "Backend SaludPublica" cmd /k "cd /d C:\Users\migue\OneDrive\Documentos\SaludPublicaConnect\backend && npm run start:dev"
echo Abriendo el frontend en una ventana nueva (puerto 3000)...
start "Frontend SaludPublica" cmd /k "cd /d C:\Users\migue\OneDrive\Documentos\SaludPublicaConnect\frontend && npm run dev"
timeout /t 5 /nobreak >nul
echo Abriendo la aplicacion en el navegador...
start http://localhost:3000
echo.
echo Listo. Cuando quieras apagar, cierra las 2 ventanas negras.
echo No cierres esta ventana hasta que las otras 2 se hayan abierto.
pause