# Sistema de Gestión de Nómina Agrícola

Sistema de gestión de nómina desarrollado específicamente para empresas agrícolas, construido con Next.js 15, TypeScript y Supabase.

## 🚀 Tecnologías

- **Frontend**: Next.js 15.5.4 con App Router
- **UI**: React 19.1.0 + Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL)
- **Tipado**: TypeScript 5 con tipos generados automáticamente
- **Desarrollo**: Turbopack para builds ultra-rápidos

## 📊 Esquema de Base de Datos

El sistema maneja las siguientes entidades principales:

### Tablas
- **`trabajadores`**: Información de empleados (DNI, nombre, modalidad laboral)
- **`puestos_de_trabajo`**: Catálogo de puestos con tarifas base
- **`parametros_legales`**: Parámetros legales (RMV, tasas de beneficios)
- **`trabajador_puestos`**: Asignaciones históricas trabajador-puesto
- **`pruebas`**: Tabla de testing para conexión

### Enums
- **`modalidad_laboral`**: `"planilla"` | `"rh"` | `"eventual"`
- **`tipo_parametro`**: `"rmv"` | `"tasa_bono_beta"` | `"tasa_gratificacion"` | `"tasa_cts"` | `"tasa_essalud_extra"`

## ⚙️ Configuración

### 1. Variables de Entorno
Crea un archivo `.env.local` con:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima

# Access Token para CLI de Supabase (generar tipos TypeScript)
# Obtener en: https://app.supabase.com/account/tokens
SUPABASE_ACCESS_TOKEN=tu_access_token
```

### 2. Instalación
```bash
npm install
```

### 3. Generación de Tipos TypeScript
```bash
# Generar tipos desde el esquema de Supabase
npm run types

# Modo watch para desarrollo
npm run types:watch
```

## 🔄 Scripts Disponibles

```bash
# Desarrollo con Turbopack
npm run dev

# Build optimizado
npm run build

# Producción
npm start

# Linting
npm run lint

# Generar tipos TypeScript desde Supabase
npm run types

# Watch mode para tipos (regenera automáticamente)
npm run types:watch
```

## 🏗️ Estructura del Proyecto

```
src/
├── lib/
│   ├── supabase/
│   │   └── client.ts          # Cliente tipado de Supabase
│   └── database.types.ts      # Tipos generados automáticamente
├── app/                       # App Router de Next.js
└── components/                # Componentes reutilizables

scripts/
└── generate-types.js          # Script para generar tipos TS
```

## 🔧 Configuración de Tipos TypeScript

### Generación Automática
El sistema incluye un workflow automatizado para mantener los tipos TypeScript sincronizados con el esquema de Supabase:

1. **Script de Generación**: `scripts/generate-types.js`
   - Carga variables de entorno desde `.env.local`
   - Ejecuta el CLI de Supabase para generar tipos
   - Guarda el resultado en `src/lib/database.types.ts`

2. **Integración con npm**:
   ```bash
   npm run types        # Generar una vez
   npm run types:watch  # Regenerar automáticamente
   ```

3. **Cliente Tipado**: `src/lib/supabase/client.ts`
   - Cliente de Supabase con tipos completos
   - Exports tipados para todas las tablas
   - Tipos específicos del dominio

### Uso de Tipos
```typescript
import { supabase, type Trabajador, type PuestoTrabajo } from '@/lib/supabase/client'

// Consulta tipada
const { data: trabajadores } = await supabase
  .from('trabajadores')
  .select('*')
  .returns<Trabajador[]>()
```

## 🚀 Desarrollo

### Iniciar Servidor de Desarrollo
```bash
npm run dev
```

El servidor estará disponible en [http://localhost:3000](http://localhost:3000).

### Workflow de Desarrollo
1. Realiza cambios en el esquema de Supabase
2. Ejecuta `npm run types` para regenerar tipos
3. Los tipos actualizados se reflejan automáticamente en tu IDE

## 📝 Características Implementadas

### ✅ Configuración Base
- [x] Next.js 15 con App Router y Turbopack
- [x] Integración completa con Supabase
- [x] Generación automática de tipos TypeScript
- [x] Variables de entorno configuradas
- [x] Cliente tipado de Supabase

### ✅ Módulo de Parámetros Legales (COMPLETO)
- [x] API de servicios con manejo robusto de errores
- [x] Type guards para errores específicos de Supabase
- [x] Formularios con validaciones en tiempo real
- [x] Estados de carga y feedback UX
- [x] Tabla de visualización con filtros y estados
- [x] Creación de nuevas vigencias de parámetros
- [x] RLS policies configuradas correctamente

### 🔄 En Desarrollo
- [ ] Interfaz de usuario para gestión de trabajadores
- [ ] Sistema de cálculo de nómina
- [ ] Reportes y exportación de datos
- [ ] Autenticación y roles de usuario

## 🛠️ Troubleshooting

### Error de Access Token
Si obtienes errores de autenticación al ejecutar `npm run types`:

1. Ve a [https://app.supabase.com/account/tokens](https://app.supabase.com/account/tokens)
2. Genera un nuevo Access Token
3. Actualiza `SUPABASE_ACCESS_TOKEN` en `.env.local`

### Problemas con Tipos
Si los tipos no se generan correctamente:
- Verifica que el Access Token tenga permisos
- Confirma que el proyecto ID sea correcto
- Ejecuta `npm run types` manualmente para ver errores

## 📚 Recursos

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
