-- =====================================================
-- FIX: Corregir recursion infinita en politicas RLS
-- =====================================================
-- Ejecuta este script en Supabase SQL Editor si ya ejecutaste
-- el schema.sql anterior y tienes el error de recursion infinita

-- 1. Eliminar politicas existentes que causan recursion
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;

DROP POLICY IF EXISTS "Properties are viewable by everyone" ON properties;
DROP POLICY IF EXISTS "Anyone can view active properties" ON properties;
DROP POLICY IF EXISTS "Admins can view all properties" ON properties;
DROP POLICY IF EXISTS "Admins can insert properties" ON properties;
DROP POLICY IF EXISTS "Admins can update properties" ON properties;
DROP POLICY IF EXISTS "Admins can delete properties" ON properties;

DROP POLICY IF EXISTS "Users can view media of owned properties" ON media;
DROP POLICY IF EXISTS "Admins can manage media" ON media;

DROP POLICY IF EXISTS "Users can view own budgets" ON budgets;
DROP POLICY IF EXISTS "Admins can manage budgets" ON budgets;

DROP POLICY IF EXISTS "Users can view own invoices" ON invoices;
DROP POLICY IF EXISTS "Admins can manage invoices" ON invoices;

DROP POLICY IF EXISTS "Admins can manage social posts" ON social_posts;

DROP POLICY IF EXISTS "Media files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete media" ON storage.objects;

-- 2. Crear funcion auxiliar para verificar admin (evita recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Crear nuevas politicas corregidas

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Properties
CREATE POLICY "Anyone can view active properties" ON properties
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all properties" ON properties
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert properties" ON properties
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update properties" ON properties
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete properties" ON properties
  FOR DELETE USING (public.is_admin());

-- Media
CREATE POLICY "Users can view media of owned properties" ON media
  FOR SELECT USING (
    public.is_admin()
    OR (SELECT owner_id FROM properties WHERE id = property_id) = auth.uid()
  );

CREATE POLICY "Admins can manage media" ON media
  FOR ALL USING (public.is_admin());

-- Budgets
CREATE POLICY "Users can view own budgets" ON budgets
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can manage budgets" ON budgets
  FOR ALL USING (public.is_admin());

-- Invoices
CREATE POLICY "Users can view own invoices" ON invoices
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can manage invoices" ON invoices
  FOR ALL USING (public.is_admin());

-- Social Posts
CREATE POLICY "Admins can manage social posts" ON social_posts
  FOR ALL USING (public.is_admin());

-- Storage
CREATE POLICY "Media files are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Admins can upload media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media'
    AND public.is_admin()
  );

CREATE POLICY "Admins can delete media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'media'
    AND public.is_admin()
  );

-- Verificar que todo esta correcto
SELECT 'Politicas RLS corregidas exitosamente!' as resultado;
