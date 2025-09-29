# 🚀 Configuración de Supabase y Generación de Tipos

## 📋 Pasos para Configurar Access Token

### 1. 🔑 Obtener Access Token

1. Ve a tu dashboard de Supabase: https://app.supabase.com/account/tokens
2. Haz clic en **"Generate new token"**
3. Dale un nombre descriptivo: `CLI - Desarrollo Local`
4. Copia el token generado (solo se muestra una vez)

### 2. 📝 Configurar Variable de Entorno

Agrega el token al archivo `.env.local`:

```env
# Access Token para CLI de Supabase (generar tipos TypeScript)
# Obtener en: https://app.supabase.com/account/tokens
SUPABASE_ACCESS_TOKEN=tu_access_token_aqui
```

### 3. 🔄 Generar Tipos TypeScript

#### Opción A: Usando npm script (Recomendado) ✅
```bash
npm run types
```

**✨ Esta es la implementación actual funcionando:**
- Utiliza script Node.js personalizado: `scripts/generate-types.js`
- Carga automáticamente variables de entorno desde `.env.local`
- Maneja la autenticación con Supabase CLI
- Genera archivo de 11.34 KB con todos los tipos

#### Opción B: Comando directo (alternativo)
```bash
npx supabase gen types typescript --project-id rjkrsdpuubvgkffndmzc > src/lib/database.types.ts
```
⚠️ **Nota**: Requiere configuración manual del `SUPABASE_ACCESS_TOKEN` en el entorno

#### Opción C: Modo watch (desarrollo)
```bash
npm run types:watch
```
🔄 **Auto-regenera tipos** cuando detecta cambios en el esquema

## 📁 Archivos Generados

- **`src/lib/database.types.ts`**: Tipos TypeScript del esquema de Supabase (11.34 KB generados ✅)
- **`src/lib/supabase/client.ts`**: Cliente tipado de Supabase con exports del dominio
- **`scripts/generate-types.js`**: Script Node.js para generación automática

## 🗄️ Esquema de Base de Datos Actual

### Tablas Implementadas ✅
```typescript
// Tipos disponibles en el proyecto
type Trabajador = Tables<'trabajadores'>           // Empleados con DNI, nombre, modalidad
type PuestoTrabajo = Tables<'puestos_de_trabajo'>  // Catálogo de puestos con tarifas
type ParametroLegal = Tables<'parametros_legales'> // RMV, tasas de beneficios sociales
type TrabajadorPuesto = Tables<'trabajador_puestos'> // Asignaciones históricas
type Prueba = Tables<'pruebas'>                     // Testing de conexión
```

### Enums Definidos ✅
```typescript
type ModalidadLaboral = "planilla" | "rh" | "eventual"
type TipoParametro = "rmv" | "tasa_bono_beta" | "tasa_gratificacion" | "tasa_cts" | "tasa_essalud_extra"
```

### Estadísticas del Esquema
- **📊 5 tablas** con relaciones definidas
- **🔧 2 enums** para validación de datos
- **📝 11.34 KB** de tipos TypeScript generados
- **🔗 Relaciones FK** entre trabajadores y puestos
- **📅 Campos timestamp** automáticos (created_at)

## 🎯 Uso en Componentes

```typescript
import { supabase, type Trabajador, type ParametroLegal } from '@/lib/supabase/client'
import { getLegalParameters, createLegalParameter } from '@/services/api'

// Estado tipado
const [trabajadores, setTrabajadores] = useState<Trabajador[]>([])
const [parametros, setParametros] = useState<ParametroLegal[]>([])

// Query tipado con función de API
const parametrosData = await getLegalParameters(supabase)

// Inserción tipada con manejo de errores robusto
try {
  const newParameter = await createLegalParameter(supabase, {
    tipo: 'rmv',
    valor: 1025.00,
    fecha_inicio_vigencia: '2025-10-01',
    fecha_fin_vigencia: null,
    descripcion: 'RMV actualizada según normativa'
  })
} catch (error) {
  // Error específico será mostrado: "Error de base de datos: [mensaje]"
  console.error('Error creating parameter:', error.message)
}
```

## 🔧 Scripts Disponibles

- **`npm run types`**: Genera tipos desde Supabase (implementación actual ✅)
- **`npm run types:watch`**: Regenera tipos automáticamente en desarrollo 🔄
- **`npm run dev`**: Inicia servidor de desarrollo con Turbopack
- **`npm run build`**: Compila proyecto optimizado
- **`npm run start`**: Ejecuta en modo producción
- **`npm run lint`**: Ejecuta ESLint

### Implementación Técnica del Script de Tipos
```javascript
// scripts/generate-types.js
require('dotenv').config({ path: '.env.local' })
const result = execSync('npx supabase gen types typescript --project-id rjkrsdpuubvgkffndmzc', {
  env: { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken }
})
fs.writeFileSync('src/lib/database.types.ts', result)
```

## ⚠️ Importante

- **NUNCA** commitees el `SUPABASE_ACCESS_TOKEN` al repositorio
- El token está protegido en `.gitignore`
- Regenera tipos cada vez que cambies el esquema de la BD
- El token tiene permisos de solo lectura del esquema

## 🔍 Troubleshooting

### Error: "Access token not provided"
1. Verifica que `SUPABASE_ACCESS_TOKEN` esté en `.env.local`
2. Reinicia tu terminal
3. Asegúrate de que el token no haya expirado

### Error: "Permission denied"
1. Verifica que el token tenga permisos de lectura
2. Confirma que el project-id sea correcto: `rjkrsdpuubvgkffndmzc`

### Tipos desactualizados
1. Ejecuta `npm run types` después de cambios en BD
2. Reinicia TypeScript server en VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

### RLS Policy Issues
Si obtienes errores como `"new row violates row-level security policy"`:
1. **Para desarrollo**: Deshabilita RLS temporalmente
   ```sql
   ALTER TABLE parametros_legales DISABLE ROW LEVEL SECURITY;
   ```
2. **Para producción**: Crea políticas específicas
   ```sql
   CREATE POLICY "Allow authenticated users to insert"
   ON parametros_legales FOR INSERT TO authenticated WITH CHECK (true);
   ```

## 🚀 Estado Actual de Implementación

### ✅ Módulo Parámetros Legales (COMPLETADO)
- **API robusta**: `src/services/api.ts` con manejo avanzado de errores
- **Type guards**: `src/utils/isPostgrestError.ts` para errores específicos
- **UI completa**: Tabla de visualización y formulario de creación
- **Validaciones**: En tiempo real con feedback UX
- **RLS**: Configurado correctamente para operaciones CRUD