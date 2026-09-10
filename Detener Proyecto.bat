@echo off
title SaludPublica Connect - Detener
echo Deteniendo base de datos y Redis (los datos se conservan)...
cd /d "C:\Users\migue\OneDrive\Documentos\SaludPublicaConnect"
docker compose stop
echo.
echo Listo. Puedes cerrar las ventanas del backend y frontend.
pause