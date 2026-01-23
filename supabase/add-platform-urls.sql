-- =====================================================
-- Agregar campos de URLs/IDs de plataformas
-- =====================================================
-- Ejecutar en Supabase SQL Editor

-- Agregar columnas para URLs e IDs de plataformas
ALTER TABLE properties ADD COLUMN IF NOT EXISTS google_place_id TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS booking_url TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS airbnb_url TEXT;

-- Agregar columna para fecha de ultima actualizacion de ratings
ALTER TABLE properties ADD COLUMN IF NOT EXISTS ratings_updated_at TIMESTAMPTZ;

-- Verificar
SELECT 'Columnas de plataformas agregadas!' as resultado;
