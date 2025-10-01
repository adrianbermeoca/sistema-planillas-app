-- =====================================================
-- 0. Define User Role ENUM (AÑADIDO PARA CORREGIR EL ERROR)
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rol_usuario_enum') THEN
        CREATE TYPE public.rol_usuario_enum AS ENUM ('Coordinador', 'Supervisor', 'Gerente');
    ELSE
        -- Si el tipo ya existe, nos aseguramos de que los valores estén presentes
        ALTER TYPE public.rol_usuario_enum ADD VALUE IF NOT EXISTS 'Coordinador';
        ALTER TYPE public.rol_usuario_enum ADD VALUE IF NOT EXISTS 'Supervisor';
        ALTER TYPE public.rol_usuario_enum ADD VALUE IF NOT EXISTS 'Gerente';
    END IF;
END$$;

-- =====================================================
-- 1. Create profiles table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo TEXT,
  rol rol_usuario_enum NOT NULL DEFAULT 'Supervisor', -- Ahora usará el ENUM que acabamos de definir
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Perfiles de usuario extendidos con roles del sistema';

-- ... (El resto del script de Claude se mantiene exactamente igual) ...

-- 2. Create index for faster lookups
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_rol ON public.profiles(rol);

-- 3. Create function to handle new user registration
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, rol, nombre_completo)
  VALUES (
    NEW.id,
    'Supervisor',  -- Default role
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS 'Crea automáticamente un perfil cuando se registra un nuevo usuario';

-- 4. Create trigger on auth.users
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Enable Row Level Security
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies if they exist
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Coordinadores can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Coordinadores can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Coordinadores can insert profiles" ON public.profiles;

-- 7. Create RLS Policies
-- =====================================================

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Users can update their own nombre_completo (not rol)
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND rol = (SELECT rol FROM public.profiles WHERE id = auth.uid())  -- Prevent role change
  );

-- Policy 3: Coordinadores can view all profiles
CREATE POLICY "Coordinadores can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'Coordinador'
    )
  );

-- Policy 4: Coordinadores can update any profile (including roles)
CREATE POLICY "Coordinadores can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'Coordinador'
    )
  );

-- Policy 5: Coordinadores can insert new profiles (for manual user creation)
CREATE POLICY "Coordinadores can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'Coordinador'
    )
  );

-- 8. Create updated_at trigger function
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger for updated_at
-- =====================================================
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Grant necessary permissions
-- =====================================================
-- GRANT SELECT, UPDATE ON public.profiles TO authenticated;
-- GRANT ALL ON public.profiles TO service_role;
-- Comentado para evitar posibles errores de permisos preexistentes. Descomentar si es necesario.