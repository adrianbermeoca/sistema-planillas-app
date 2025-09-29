@echo off
echo 🔄 Generando tipos TypeScript desde Supabase...
echo.

REM Verificar que existe la variable de entorno
if "%SUPABASE_ACCESS_TOKEN%"=="" (
    echo ❌ Error: SUPABASE_ACCESS_TOKEN no está configurado
    echo.
    echo 📋 Pasos para configurar:
    echo 1. Ve a https://app.supabase.com/account/tokens
    echo 2. Genera un nuevo Access Token
    echo 3. Agrega la línea al archivo .env.local:
    echo    SUPABASE_ACCESS_TOKEN=tu_token_aqui
    echo 4. Reinicia tu terminal
    echo.
    pause
    exit /b 1
)

echo ✅ Access token encontrado
echo 🚀 Ejecutando comando de generación...
echo.

REM Generar tipos TypeScript
npx supabase gen types typescript --project-id rjkrsdpuubvgkffndmzc > src/lib/database.types.ts

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ ¡Tipos generados exitosamente!
    echo 📁 Archivo: src/lib/database.types.ts
    echo.
) else (
    echo.
    echo ❌ Error al generar tipos
    echo Revisa tu Access Token y conexión a internet
    echo.
)

pause