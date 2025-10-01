# Guía de Configuración de Perfiles y RLS

> **Fecha:** 01-10-2025
> **Fase:** Completar Autenticación con Roles
> **Prerequisito:** Sistema de autenticación básico implementado

---

## 📋 Resumen

Esta guía te ayudará a:
1. Aplicar la migración de la tabla `profiles`
2. Configurar Row Level Security (RLS)
3. Crear tu primer usuario Coordinador
4. Verificar que todo funcione correctamente

---

## 🚀 Pasos de Implementación

### Paso 1: Aplicar la Migración SQL

**Opción A: Usando Supabase Dashboard (Recomendado para desarrollo)**

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **SQL Editor** (icono de base de datos en la barra lateral)
3. Haz clic en **+ New Query**
4. Copia y pega el contenido completo de:
   ```
   supabase/migrations/20251001_create_profiles_and_rls.sql
   ```
5. Haz clic en **Run** o presiona `Ctrl+Enter`
6. Verifica que aparezca el mensaje de éxito ✅

**Opción B: Usando Supabase CLI (Para producción)**

```bash
# Asegúrate de tener Supabase CLI instalado
supabase db push

# O aplica la migración específica
supabase migration up
```

---

### Paso 2: Verificar la Creación de la Tabla

Ejecuta esta query en el SQL Editor para verificar:

```sql
-- Verificar que la tabla existe
SELECT * FROM public.profiles;

-- Verificar que RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Verificar las políticas creadas
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';

-- Verificar el trigger
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

**Resultado Esperado:**
- La tabla `profiles` debe existir
- `rowsecurity` debe ser `true`
- Deben existir 5 políticas RLS
- El trigger `on_auth_user_created` debe existir

---

### Paso 3: Crear tu Primer Usuario Coordinador

#### 3.1. Crear Usuario en Supabase Auth

**Opción A: Desde Supabase Dashboard**

1. Ve a **Authentication → Users**
2. Haz clic en **Add user → Create new user**
3. Ingresa:
   - **Email:** `coordinador@agropall.com` (o el email que prefieras)
   - **Password:** Una contraseña segura
4. Haz clic en **Create user**
5. **Importante:** Copia el UUID del usuario que se muestra

**Opción B: Desde la aplicación**

1. Si la página de registro está habilitada, regístrate normalmente
2. El usuario se creará automáticamente con rol `Supervisor`
3. Luego actualiza el rol manualmente (ver paso 3.2)

#### 3.2. Actualizar Rol a Coordinador

Ejecuta esta query en SQL Editor (reemplaza el UUID):

```sql
-- Reemplaza 'TU-USER-UUID-AQUI' con el UUID real del usuario
UPDATE public.profiles
SET
  rol = 'Coordinador',
  nombre_completo = 'Coordinador de Operaciones'
WHERE id = 'TU-USER-UUID-AQUI';

-- Verificar el cambio
SELECT id, rol, nombre_completo, created_at
FROM public.profiles
WHERE rol = 'Coordinador';
```

**Ejemplo con UUID real:**
```sql
UPDATE public.profiles
SET
  rol = 'Coordinador',
  nombre_completo = 'Juan Pérez'
WHERE id = '8a5e7c2d-4b3f-4e9a-a1c3-f5d8e9b2c4a1';
```

---

### Paso 4: Probar el Flujo Completo

#### Test 1: Login y Visualización de Rol

1. **Cerrar sesión** si estás autenticado:
   - Haz clic en el botón "Cerrar Sesión" en el sidebar

2. **Iniciar sesión** con el usuario Coordinador:
   - Ve a `http://localhost:3000/login`
   - Ingresa el email y contraseña del Coordinador
   - Haz clic en "Iniciar Sesión"

3. **Verificar que se muestre el rol correcto**:
   - En el sidebar inferior, debe aparecer:
     ```
     [Avatar J] Juan Pérez
              Coordinador
     ```

**✅ Resultado Esperado:**
- Debe mostrarse el nombre completo (si existe) o email
- Debe mostrarse el rol "Coordinador"
- NO debe decir "Supervisor" hardcoded

#### Test 2: Registro de Nuevo Usuario (Trigger Automático)

1. Crea un segundo usuario desde Supabase Dashboard:
   - Email: `supervisor@agropall.com`
   - Password: Contraseña segura

2. Verifica que se creó el perfil automáticamente:
   ```sql
   SELECT id, rol, nombre_completo, created_at
   FROM public.profiles
   WHERE id = (
     SELECT id FROM auth.users WHERE email = 'supervisor@agropall.com'
   );
   ```

**✅ Resultado Esperado:**
- Debe existir un registro en `profiles` con rol `Supervisor` (default)
- El trigger funcionó correctamente

#### Test 3: Row Level Security (RLS)

Inicia sesión con el supervisor y verifica:

1. **El supervisor puede ver su propio perfil:**
   ```typescript
   // En consola del navegador (F12)
   const { data, error } = await supabase
     .from('profiles')
     .select('*')
     .eq('id', user.id)
   console.log(data) // Debe mostrar su perfil
   ```

2. **El supervisor NO puede ver otros perfiles:**
   ```typescript
   const { data, error } = await supabase
     .from('profiles')
     .select('*')
   console.log(data) // Debe estar vacío o solo su perfil
   ```

3. **El supervisor NO puede cambiar su rol:**
   ```typescript
   const { data, error } = await supabase
     .from('profiles')
     .update({ rol: 'Coordinador' })
     .eq('id', user.id)
   console.log(error) // Debe mostrar error de política RLS
   ```

**✅ Resultado Esperado:**
- RLS está funcionando correctamente
- Cada usuario solo ve su propio perfil
- Solo Coordinadores pueden ver/modificar todos los perfiles

---

## 🔍 Troubleshooting

### Problema 1: No aparece el rol en el sidebar

**Síntomas:**
- Se muestra "Supervisor" en lugar del rol real
- La consola muestra error "relation profiles does not exist"

**Solución:**
```sql
-- Verificar que la tabla existe
SELECT * FROM public.profiles;

-- Si no existe, ejecuta nuevamente la migración
-- Ver Paso 1
```

### Problema 2: Error "new row violates row-level security policy"

**Síntomas:**
- Al crear usuario aparece error de RLS
- El trigger no puede insertar en profiles

**Solución:**
```sql
-- Verificar que el trigger tiene SECURITY DEFINER
SELECT prosecdef FROM pg_proc WHERE proname = 'handle_new_user';
-- Debe retornar 't' (true)

-- Si retorna 'f', recrea la función:
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, rol)
  VALUES (NEW.id, 'Supervisor');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Problema 3: El componente UserInfo muestra "Cargando..." indefinidamente

**Síntomas:**
- El sidebar muestra "Cargando..." permanentemente
- No aparece información del usuario

**Solución:**
1. Abre la consola del navegador (F12)
2. Busca errores relacionados con Supabase
3. Verifica que el usuario tiene un perfil:
   ```sql
   SELECT p.*, u.email
   FROM public.profiles p
   JOIN auth.users u ON u.id = p.id
   WHERE u.email = 'tu-email@ejemplo.com';
   ```
4. Si no existe el perfil, créalo manualmente:
   ```sql
   INSERT INTO public.profiles (id, rol, nombre_completo)
   SELECT id, 'Supervisor', email
   FROM auth.users
   WHERE email = 'tu-email@ejemplo.com';
   ```

### Problema 4: Tipos TypeScript no reconocen la tabla profiles

**Síntomas:**
- TypeScript marca error en `.from('profiles')`
- Autocompletado no funciona

**Solución:**
```bash
# Regenerar tipos desde la base de datos
npx supabase gen types typescript --project-id rjkrsdpuubvgkffndmzc > src/lib/database.types.ts

# Asegúrate de tener SUPABASE_ACCESS_TOKEN en .env.local
# Si no funciona, genera tipos desde Supabase Dashboard:
# Settings → API → Generate Types
```

---

## 📊 Estructura de Datos

### Tabla `profiles`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | PK, referencia a `auth.users(id)` |
| `nombre_completo` | TEXT | Nombre completo del usuario (opcional) |
| `rol` | rol_usuario_enum | 'Coordinador', 'Supervisor', o 'Gerente' |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Última actualización |

### Políticas RLS Creadas

1. **"Users can view their own profile"**
   - Permite a usuarios ver su propio perfil
   - Condición: `auth.uid() = id`

2. **"Users can update their own profile"**
   - Permite actualizar nombre_completo pero NO rol
   - Condición: `auth.uid() = id` + rol no puede cambiar

3. **"Coordinadores can view all profiles"**
   - Coordinadores pueden ver todos los perfiles
   - Condición: Usuario actual tiene rol 'Coordinador'

4. **"Coordinadores can update all profiles"**
   - Coordinadores pueden modificar cualquier perfil incluyendo roles
   - Condición: Usuario actual tiene rol 'Coordinador'

5. **"Coordinadores can insert profiles"**
   - Coordinadores pueden crear perfiles manualmente
   - Útil para administración de usuarios

---

## 🎯 Próximos Pasos

Una vez completada esta configuración, puedes proceder con:

### Fase 2: Implementar Control de Acceso por Rol

1. **Crear middleware de roles**
   - Proteger `/parametros` solo para Coordinadores
   - Restringir vistas según rol

2. **Agregar verificación en componentes**
   - Mostrar/ocultar botones según rol
   - Deshabilitar acciones no permitidas

3. **Crear página de gestión de usuarios**
   - Solo para Coordinadores
   - CRUD completo de usuarios y roles

### Mejoras Recomendadas

- [ ] Agregar campo `avatar_url` a profiles
- [ ] Implementar carga de imágenes de perfil
- [ ] Crear formulario de edición de perfil
- [ ] Agregar validaciones adicionales
- [ ] Implementar logs de cambios de roles

---

## 📚 Referencias

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/sql-createtrigger.html)
- [Next.js 15 Authentication](https://nextjs.org/docs/app/building-your-application/authentication)

---

## ✅ Checklist de Verificación

Antes de considerar esta fase completa, verifica:

- [ ] La tabla `profiles` existe y tiene RLS habilitado
- [ ] El trigger `on_auth_user_created` está creado y funciona
- [ ] Las 5 políticas RLS están aplicadas
- [ ] Existe al menos un usuario con rol `Coordinador`
- [ ] El componente `UserInfo` muestra el rol real desde la BD
- [ ] Los nuevos usuarios obtienen perfil automáticamente
- [ ] RLS impide que usuarios vean perfiles de otros
- [ ] Coordinadores pueden ver todos los perfiles

---

**Implementado por:** Claude (Anthropic)
**Fecha:** 01-10-2025
**Versión:** 1.0
