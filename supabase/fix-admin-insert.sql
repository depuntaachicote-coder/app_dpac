-- =====================================================
-- FIX: Resolver problema de insercion de propiedades
-- =====================================================
-- Este script arregla el problema donde la creacion de propiedades
-- se queda colgada debido a las politicas RLS.
--
-- EJECUTAR EN SUPABASE SQL EDITOR
-- =====================================================

-- 1. Eliminar la funcion is_admin existente
DROP FUNCTION IF EXISTS public.is_admin();

-- 2. Crear la funcion is_admin con SECURITY DEFINER correctamente configurada
-- La clave es usar SET search_path para evitar problemas de seguridad
-- y asegurar que la funcion puede leer profiles sin restricciones RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 3. Dar permisos de ejecucion a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 4. Eliminar y recrear politicas de properties para asegurar consistencia
DROP POLICY IF EXISTS "Anyone can view active properties" ON properties;
DROP POLICY IF EXISTS "Admins can view all properties" ON properties;
DROP POLICY IF EXISTS "Admins can insert properties" ON properties;
DROP POLICY IF EXISTS "Admins can update properties" ON properties;
DROP POLICY IF EXISTS "Admins can delete properties" ON properties;

-- 5. Recrear politicas con la nueva funcion
-- SELECT: Cualquiera puede ver propiedades activas
CREATE POLICY "Anyone can view active properties" ON properties
  FOR SELECT USING (is_active = true);

-- SELECT: Admins pueden ver todas las propiedades
CREATE POLICY "Admins can view all properties" ON properties
  FOR SELECT USING (public.is_admin());

-- INSERT: Solo admins pueden crear propiedades
CREATE POLICY "Admins can insert properties" ON properties
  FOR INSERT WITH CHECK (public.is_admin());

-- UPDATE: Solo admins pueden actualizar propiedades
CREATE POLICY "Admins can update properties" ON properties
  FOR UPDATE USING (public.is_admin());

-- DELETE: Solo admins pueden eliminar propiedades
CREATE POLICY "Admins can delete properties" ON properties
  FOR DELETE USING (public.is_admin());

-- 6. Verificar que la funcion funciona
-- Deberia devolver true si el usuario actual es admin
SELECT
  CASE
    WHEN public.is_admin() THEN 'La funcion is_admin() funciona correctamente - eres admin!'
    ELSE 'La funcion is_admin() funciona pero NO eres admin'
  END as resultado;

-- 7. Verificar que el perfil del admin existe y tiene rol correcto
SELECT id, email, role, created_at
FROM profiles
WHERE role = 'admin';
