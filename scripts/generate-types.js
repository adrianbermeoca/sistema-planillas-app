#!/usr/bin/env node

// Script para generar tipos TypeScript desde Supabase con dotenv
const { execSync } = require('child_process')
const path = require('path')

// Cargar variables de entorno desde .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

console.log('🔄 Generando tipos TypeScript desde Supabase...\n')

// Verificar que existe el access token
const accessToken = process.env.SUPABASE_ACCESS_TOKEN
if (!accessToken) {
  console.error('❌ Error: SUPABASE_ACCESS_TOKEN no está configurado en .env.local')
  console.log('\n📋 Pasos para configurar:')
  console.log('1. Ve a https://app.supabase.com/account/tokens')
  console.log('2. Genera un nuevo Access Token')
  console.log('3. Agrega la línea al archivo .env.local:')
  console.log('   SUPABASE_ACCESS_TOKEN=tu_token_aqui')
  process.exit(1)
}

console.log('✅ Access token encontrado')
console.log('🚀 Ejecutando comando de generación...\n')

try {
  // Ejecutar comando de generación con variable de entorno
  const command = 'npx supabase gen types typescript --project-id rjkrsdpuubvgkffndmzc'
  const outputFile = path.join(__dirname, '..', 'src', 'lib', 'database.types.ts')

  // Ejecutar comando con el token en el entorno
  const result = execSync(command, {
    env: {
      ...process.env,
      SUPABASE_ACCESS_TOKEN: accessToken
    },
    encoding: 'utf8'
  })

  // Escribir resultado al archivo
  const fs = require('fs')
  fs.writeFileSync(outputFile, result)

  console.log('✅ ¡Tipos generados exitosamente!')
  console.log(`📁 Archivo: ${outputFile}`)

  // Mostrar estadísticas del archivo
  const stats = fs.statSync(outputFile)
  console.log(`📊 Tamaño: ${Math.round(stats.size / 1024 * 100) / 100} KB`)
  console.log(`🕐 Generado: ${stats.mtime.toLocaleString()}`)

} catch (error) {
  console.error('\n❌ Error al generar tipos:', error.message)
  console.log('Revisa tu Access Token y conexión a internet')
  process.exit(1)
}