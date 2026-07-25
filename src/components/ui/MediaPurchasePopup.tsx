import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock, ShoppingCart, X, Euro, Package,
  Sparkles, Image as ImageIcon, Video,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Profile } from '../../types/database'

interface MediaPurchasePopupProps {
  profile: Profile
}

interface PricingConfig {
  price_per_file: number | null
  price_per_file_pack: number | null
}

interface LockedStats {
  total: number
  pricedCount: number
  imageCount: number
  videoCount: number
}

// Cooldown de módulo: evita doble popup si dos instancias montan al mismo tiempo
// (ej: DashboardLayout + UserMedia cargan juntos en el mismo navigate)
let _lastShownMs = 0
const COOLDOWN_MS = 5_000

export default function MediaPurchasePopup({ profile }: MediaPurchasePopupProps) {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [stats, setStats] = useState<LockedStats | null>(null)
  const [pricing, setPricing] = useState<PricingConfig | null>(null)

  useEffect(() => {
    const tag = '[MediaPopup]'

    if (!['host', 'manager'].includes(profile.user_type ?? '')) {
      console.log(tag, 'Usuario no es host ni manager:', profile.user_type)
      return
    }

    // Cooldown: si otra instancia ya mostró el popup hace menos de 5s, no duplicar
    if (Date.now() - _lastShownMs < COOLDOWN_MS) {
      console.log(tag, 'Cooldown activo, saltando instancia duplicada.')
      return
    }

    load(tag)
  }, [profile.id])

  const load = async (tag: string) => {
    try {
      // ── 1. Resolver propiedad ─────────────────────────────────────
      const { data: ownedProp, error: ownedErr } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', profile.id)
        .maybeSingle()

      if (ownedErr) console.warn(tag, 'Error buscando propiedad propia:', ownedErr.message)

      let propertyId = (ownedProp as { id: string } | null)?.id

      if (!propertyId) {
        // @ts-ignore
        const { data: link, error: linkErr } = await supabase
          .from('property_clients')
          .select('property_id')
          .eq('user_id', profile.id)
          .maybeSingle()

        if (linkErr) console.warn(tag, 'Error buscando property_clients:', linkErr.message)
        propertyId = (link as { property_id: string } | null)?.property_id
      }

      if (!propertyId) {
        console.log(tag, 'Sin propiedad vinculada para user_id:', profile.id)
        return
      }

      console.log(tag, 'Propiedad encontrada:', propertyId)

      // ── 2. Compras ya realizadas ──────────────────────────────────
      // @ts-ignore
      const { data: purchases, error: purchErr } = await supabase
        .from('media_purchases')
        .select('media_id')
        .eq('user_id', profile.id)

      if (purchErr) console.warn(tag, 'Error leyendo compras:', purchErr.message)

      const purchasedIds = new Set(
        ((purchases ?? []) as { media_id: string }[]).map((p) => p.media_id)
      )
      console.log(tag, 'Archivos ya comprados:', purchasedIds.size)

      // ── 3. Todo el media de la propiedad ─────────────────────────
      const { data: allMedia, error: mediaErr } = await supabase
        .from('media')
        .select('id, file_type, price, is_available')
        .eq('property_id', propertyId)

      if (mediaErr) console.warn(tag, 'Error leyendo media:', mediaErr.message)

      if (!allMedia || allMedia.length === 0) {
        console.log(tag, 'Sin archivos de media para la propiedad.')
        return
      }

      type MediaRow = { id: string; file_type: string; price: number | null; is_available: boolean }
      const rows = allMedia as MediaRow[]

      console.log(tag, `Total media encontrado: ${rows.length}`, {
        available: rows.filter(m => m.is_available).length,
        notAvailable: rows.filter(m => !m.is_available).length,
        withPrice: rows.filter(m => m.price != null).length,
      })

      // Mostrar popup por archivos bloqueados (is_available=false) O que tienen precio
      // y no han sido comprados — cualquiera de las dos condiciones activa el popup
      const locked = rows.filter(
        (m) =>
          !purchasedIds.has(m.id) &&
          (!m.is_available || m.price != null)
      )

      console.log(tag, 'Archivos a mostrar en popup:', locked.length)

      if (locked.length === 0) {
        console.log(tag, 'Todo el media ya está disponible o comprado. Popup no mostrado.')
        return
      }

      setStats({
        total: locked.length,
        pricedCount: locked.filter(m => m.price != null).length,
        imageCount: locked.filter(m => m.file_type === 'image').length,
        videoCount: locked.filter(m => m.file_type === 'video').length,
      })

      // ── 4. Configuración de precios ───────────────────────────────
      // @ts-ignore
      const { data: cfg, error: cfgErr } = await supabase
        .from('media_pricing_config')
        .select('price_per_file, price_per_file_pack')
        .eq('id', 1)
        .maybeSingle()

      if (cfgErr) console.warn(tag, 'Error leyendo precios:', cfgErr.message)
      if (cfg) {
        console.log(tag, 'Precios globales:', cfg)
        setPricing(cfg as PricingConfig)
      }

      // Registrar timestamp para cooldown entre instancias
      _lastShownMs = Date.now()
      setVisible(true)
      console.log(tag, 'Popup activado.')
    } catch (err) {
      console.error('[MediaPopup] Error inesperado en load():', err)
    }
  }

  const dismiss = () => {
    setVisible(false)
  }

  const goToMedia = () => {
    dismiss()
    navigate('/dashboard/media?tab=buy')
  }

  const packSavings =
    stats &&
    stats.total >= 10 &&
    pricing?.price_per_file != null &&
    pricing?.price_per_file_pack != null
      ? {
          unitTotal: stats.total * pricing.price_per_file,
          packTotal: stats.total * pricing.price_per_file_pack,
          saved: stats.total * (pricing.price_per_file - pricing.price_per_file_pack),
        }
      : null

  return (
    <AnimatePresence>
      {visible && stats && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={dismiss}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white shadow-2xl overflow-hidden">

              {/* Hero */}
              <div className="bg-primary-900 px-6 py-5 relative">
                <button
                  onClick={dismiss}
                  className="absolute top-4 right-4 p-1.5 text-white/50 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Lock size={19} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] text-primary-400 uppercase tracking-widest mb-0.5">
                      Tu galería profesional
                    </p>
                    <h2 className="text-lg font-bold text-white leading-snug">
                      {stats.total} archivo{stats.total !== 1 ? 's' : ''}{' '}
                      {stats.pricedCount > 0 ? 'disponible' : 'en preparación'}
                      {stats.total !== 1 ? 's' : ''} para adquirir
                    </h2>
                    <div className="flex gap-2 mt-2.5">
                      {stats.imageCount > 0 && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 text-white text-xs font-medium">
                          <ImageIcon size={11} />
                          {stats.imageCount} foto{stats.imageCount !== 1 ? 's' : ''}
                        </span>
                      )}
                      {stats.videoCount > 0 && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 text-white text-xs font-medium">
                          <Video size={11} />
                          {stats.videoCount} vídeo{stats.videoCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">

                {/* Precios — solo si hay archivos con precio */}
                {stats.pricedCount > 0 && pricing &&
                  (pricing.price_per_file != null || pricing.price_per_file_pack != null) && (
                  <div className="grid grid-cols-2 gap-3">
                    {pricing.price_per_file != null && (
                      <div className="border border-primary-200 p-3 text-center">
                        <p className="text-xs text-primary-500 mb-1">Unitario</p>
                        <p className="text-xl font-bold text-primary-900 flex items-center justify-center gap-0.5">
                          <Euro size={14} />
                          {pricing.price_per_file.toFixed(2)}
                        </p>
                        <p className="text-[11px] text-primary-400 mt-0.5">por archivo</p>
                      </div>
                    )}
                    {pricing.price_per_file_pack != null && (
                      <div className="border border-amber-200 bg-amber-50 p-3 text-center">
                        <p className="text-xs text-amber-600 mb-1 flex items-center justify-center gap-1">
                          <Package size={11} />Pack ≥ 10
                        </p>
                        <p className="text-xl font-bold text-amber-700 flex items-center justify-center gap-0.5">
                          <Euro size={14} />
                          {pricing.price_per_file_pack.toFixed(2)}
                        </p>
                        <p className="text-[11px] text-amber-600 mt-0.5">por archivo</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Ahorro pack ≥10 */}
                {packSavings && (
                  <div className="bg-green-50 border border-green-200 p-3">
                    <p className="font-semibold text-green-800 text-sm flex items-center gap-1.5 mb-1.5">
                      <Sparkles size={14} />
                      ¡Ahorro por pack disponible!
                    </p>
                    <p className="text-green-700 text-xs leading-relaxed">
                      Adquiriendo tus {stats.total} archivos en pack:{' '}
                      <strong>
                        {packSavings.packTotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </strong>
                      {' '}en lugar de{' '}
                      <span className="line-through text-green-600">
                        {packSavings.unitTotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </span>
                      {' '}— ahorras{' '}
                      <strong className="text-green-900">
                        {packSavings.saved.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </strong>
                    </p>
                  </div>
                )}

                {/* Aviso precio pack cuando hay <10 */}
                {!packSavings &&
                  stats.pricedCount > 0 &&
                  pricing?.price_per_file != null &&
                  pricing?.price_per_file_pack != null &&
                  stats.total < 10 && (
                  <div className="bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
                    <p className="font-semibold mb-0.5">Precio especial por pack</p>
                    <p>
                      Seleccionando 10 o más archivos el precio baja a{' '}
                      <strong>
                        {pricing.price_per_file_pack.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        /archivo
                      </strong>.
                    </p>
                  </div>
                )}

                {/* Sin precio todavía */}
                {stats.pricedCount === 0 && (
                  <div className="bg-primary-50 border border-primary-200 p-3 text-sm text-primary-700">
                    <p className="font-semibold mb-0.5">Tu contenido está listo</p>
                    <p className="text-xs leading-relaxed">
                      Estamos configurando los precios de tu galería. En breve podrás adquirir tus archivos directamente desde la app.
                    </p>
                  </div>
                )}

                {/* CTAs */}
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={goToMedia}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-primary-900 text-white font-semibold text-sm hover:bg-primary-800 transition-colors"
                  >
                    <ShoppingCart size={18} />
                    {stats.pricedCount > 0 ? 'Ver archivos disponibles' : 'Ver mi galería'}
                  </button>
                  <button
                    onClick={dismiss}
                    className="w-full py-2.5 text-sm text-primary-400 hover:text-primary-700 transition-colors"
                  >
                    Ahora no
                  </button>
                </div>

              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
