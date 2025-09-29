# Script para generar tipos TypeScript desde Supabase
Write-Host "🔄 Generando tipos TypeScript desde Supabase..." -ForegroundColor Cyan
Write-Host ""

# Cargar variables de entorno desde .env.local
if (Test-Path ".env.local") {
    Write-Host "📂 Cargando .env.local..." -ForegroundColor Yellow
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match "^([^#].*)=(.*)$") {
            [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], "Process")
        }
    }
}

# Verificar Access Token
$accessToken = $env:SUPABASE_ACCESS_TOKEN
if (-not $accessToken) {
    Write-Host "❌ Error: SUPABASE_ACCESS_TOKEN no está configurado" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Pasos para configurar:" -ForegroundColor Yellow
    Write-Host "1. Ve a https://app.supabase.com/account/tokens"
    Write-Host "2. Genera un nuevo Access Token"
    Write-Host "3. Agrega la línea al archivo .env.local:"
    Write-Host "   SUPABASE_ACCESS_TOKEN=tu_token_aqui"
    Write-Host "4. Ejecuta este script nuevamente"
    Write-Host ""
    Read-Host "Presiona Enter para continuar"
    exit 1
}

Write-Host "✅ Access token encontrado" -ForegroundColor Green
Write-Host "🚀 Ejecutando comando de generación..." -ForegroundColor Cyan
Write-Host ""

# Ejecutar comando de generación
try {
    npx supabase gen types typescript --project-id rjkrsdpuubvgkffndmzc > src/lib/database.types.ts

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ ¡Tipos generados exitosamente!" -ForegroundColor Green
        Write-Host "📁 Archivo: src/lib/database.types.ts" -ForegroundColor Gray
        Write-Host ""

        # Mostrar estadísticas del archivo
        $fileInfo = Get-Item "src/lib/database.types.ts"
        Write-Host "📊 Tamaño: $([math]::Round($fileInfo.Length / 1KB, 2)) KB" -ForegroundColor Gray
        Write-Host "🕐 Generado: $($fileInfo.LastWriteTime)" -ForegroundColor Gray
    } else {
        throw "Error al ejecutar comando"
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error al generar tipos" -ForegroundColor Red
    Write-Host "Revisa tu Access Token y conexión a internet" -ForegroundColor Yellow
    Write-Host ""
}

Read-Host "Presiona Enter para continuar"