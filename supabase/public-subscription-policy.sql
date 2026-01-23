-- =====================================================
-- Politica para permitir suscripciones publicas
-- =====================================================
-- Ejecutar despues del email-marketing-schema.sql

-- Eliminar politica anterior si existe
DROP POLICY IF EXISTS "Admins can manage email subscribers" ON email_subscribers;
DROP POLICY IF EXISTS "Anyone can subscribe" ON email_subscribers;

-- Politica para que cualquiera pueda suscribirse (INSERT)
CREATE POLICY "Anyone can subscribe" ON email_subscribers
  FOR INSERT WITH CHECK (true);

-- Politica para que admins puedan ver y gestionar suscriptores
CREATE POLICY "Admins can manage email subscribers" ON email_subscribers
  FOR ALL USING (public.is_admin());

-- Verificar
SELECT 'Politica de suscripcion publica creada!' as resultado;
