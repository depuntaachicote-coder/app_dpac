-- =====================================================
-- De Punta a Chicote - Super Administrator Setup
-- =====================================================
--
-- CREDENCIALES DEL SUPER ADMINISTRADOR:
-- Email: depuntaachicote@gmail.com
-- Password: dpac2026
--
-- =====================================================
-- OPCION 1: Registro Automatico (Recomendado)
-- =====================================================
--
-- El schema.sql ya incluye un trigger que asigna automaticamente
-- el rol 'admin' cuando se registra el email: depuntaachicote@gmail.com
--
-- Pasos:
-- 1. Asegurate de haber ejecutado schema.sql primero
-- 2. Ve a tu aplicacion web
-- 3. Registrate con:
--    - Email: depuntaachicote@gmail.com
--    - Password: dpac2026
--    - Nombre: De Punta a Chicote
--    - Empresa: De Punta a Chicote
-- 4. El sistema te asignara automaticamente el rol de administrador
--
-- =====================================================
-- OPCION 2: Via Supabase Dashboard
-- =====================================================
--
-- 1. Ve a tu proyecto en Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Ve a Authentication > Users > Add User
-- 3. Crea el usuario con:
--    - Email: depuntaachicote@gmail.com
--    - Password: dpac2026
--    - Marca "Auto Confirm User" para activar inmediatamente
-- 4. Ejecuta este script en SQL Editor:

UPDATE profiles
SET
  role = 'admin',
  full_name = 'De Punta a Chicote',
  company_name = 'De Punta a Chicote',
  updated_at = NOW()
WHERE email = 'depuntaachicote@gmail.com';

-- Verificar que se actualizo correctamente
SELECT id, email, full_name, role, created_at
FROM profiles
WHERE email = 'depuntaachicote@gmail.com';

-- =====================================================
-- CO-ADMINISTRADORES (Opcional)
-- =====================================================
-- Ejecuta estos comandos para asignar rol admin a los socios

-- Antonio Presas - VideoFoto360
-- UPDATE profiles SET role = 'admin' WHERE email = 'antonio@videofoto360.com';

-- Noel Perez - Pontevende
-- UPDATE profiles SET role = 'admin' WHERE email = 'noel@pontevende.com';
