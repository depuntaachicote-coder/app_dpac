-- ============================================================
-- FIX: RLS completa para tabla invoices
-- Permite que los admins vean TODAS las facturas/recibos
-- de gestores, anfitriones y huéspedes
-- Run in: Supabase SQL Editor
-- ============================================================

-- 1. Actualizar is_admin() para comprobar AMBOS campos (role Y user_type)
--    La versión anterior solo comprobaba user_type, dejando fuera admins
--    que tienen role='admin' pero user_type distinto.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER   -- ejecuta con permisos del owner → evita recursión RLS
STABLE
AS $$
DECLARE
  result BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (user_type = 'admin' OR role = 'admin')
  ) INTO result;
  RETURN COALESCE(result, FALSE);
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- 2. Habilitar RLS en invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar políticas anteriores (tabla limpia)
DROP POLICY IF EXISTS "Users read own invoices"        ON public.invoices;
DROP POLICY IF EXISTS "Admins full access to invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins read all invoices"       ON public.invoices;
DROP POLICY IF EXISTS "Admins update all invoices"     ON public.invoices;
DROP POLICY IF EXISTS "Users update own invoices"      ON public.invoices;
DROP POLICY IF EXISTS "Users insert own invoices"      ON public.invoices;

-- 4. SELECT: usuarios ven solo sus propias facturas
CREATE POLICY "Users read own invoices"
  ON public.invoices FOR SELECT
  USING (user_id = auth.uid());

-- 5. SELECT: admins ven TODAS las facturas de cualquier usuario
CREATE POLICY "Admins read all invoices"
  ON public.invoices FOR SELECT
  USING (public.is_admin());

-- 6. INSERT: usuarios pueden crear sus propias facturas
--    (también permite a edge functions con service_role, que bypasea RLS)
CREATE POLICY "Users insert own invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 7. UPDATE: usuarios pueden actualizar sus propias facturas
--    (necesario para "Solicitar factura" → actualiza notes)
CREATE POLICY "Users update own invoices"
  ON public.invoices FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 8. UPDATE: admins pueden actualizar cualquier factura
--    (por si se necesita desde frontend; la edge function usa service_role)
CREATE POLICY "Admins update all invoices"
  ON public.invoices FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 9. Verificación
DO $$
BEGIN
  RAISE NOTICE '✓ is_admin() actualizada: comprueba user_type Y role';
  RAISE NOTICE '✓ RLS habilitada en invoices';
  RAISE NOTICE '✓ Políticas creadas:';
  RAISE NOTICE '  - Users read own invoices';
  RAISE NOTICE '  - Admins read all invoices';
  RAISE NOTICE '  - Users insert own invoices';
  RAISE NOTICE '  - Users update own invoices';
  RAISE NOTICE '  - Admins update all invoices';
END $$;
