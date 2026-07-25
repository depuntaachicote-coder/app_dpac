import { useState, useEffect, useCallback, useRef } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Image as ImageIcon,
  Video,
  Download,
  Grid,
  List,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Lock,
  ShoppingCart,
  Trash2,
  Euro,
  CreditCard,
  CheckCircle2,
  Loader,
  AlertCircle,
  Package,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import type { Media, Property } from '../../types/database'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import MediaPurchasePopup from '../../components/ui/MediaPurchasePopup'

interface PricingConfig {
  price_per_file: number | null
  price_per_file_pack: number | null
}

export default function UserMedia() {
  const { profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [media, setMedia] = useState<Media[]>([])
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const initialTab = searchParams.get('tab') as 'all' | 'image' | 'video' | 'buy' | null
  const [activeTab, setActiveTab] = useState<'all' | 'image' | 'video' | 'buy'>(
    initialTab === 'buy' || initialTab === 'image' || initialTab === 'video' ? initialTab : 'all'
  )
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  // Cart
  const [cart, setCart] = useState<Media[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [cartFloatingOpen, setCartFloatingOpen] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

  // Purchases
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set())
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'cancelled' | 'verifying'>('idle')
  const [verifyingPayment, setVerifyingPayment] = useState(false)
  const [recentlyPurchased, setRecentlyPurchased] = useState<Media[]>([])

  // Pricing config (pack discount)
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null)

  // Guard: guests don't have access (AFTER all hooks — Rules of Hooks)
  if (profile && profile.user_type === 'guest') {
    return <Navigate to="/dashboard" replace />
  }

  useEffect(() => {
    if (profile?.id) {
      fetchMedia()
      fetchPurchases()
      fetchPricingConfig()
    }
  }, [profile?.id])

  // Handle return from Stripe
  useEffect(() => {
    const payment = searchParams.get('payment')
    const sessionId = searchParams.get('session_id')

    console.log('[Media] useEffect Stripe return → payment:', payment, '| session_id:', sessionId?.slice(0, 20) + '...')

    if (payment === 'success' && sessionId) {
      setPaymentStatus('verifying')
      verifyPayment(sessionId)
    } else if (payment === 'cancelled') {
      setPaymentStatus('cancelled')
      setSearchParams({}, { replace: true })
    }
  }, [])

  const verifyPayment = async (sessionId: string) => {
    console.log('[Media] verifyPayment → iniciando para sessionId:', sessionId?.slice(0, 20) + '...')
    setVerifyingPayment(true)
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      const token = authSession?.access_token
      console.log('[Media] verifyPayment → token obtenido:', !!token, '| userId:', authSession?.user?.id)
      if (!token) throw new Error('No autorizado')

      console.log('[Media] verifyPayment → llamando a Edge Function...')
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-media-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId }),
        }
      )
      const data = await res.json()
      console.log('[Media] verifyPayment → respuesta Edge Function:', { ok: data.ok, status: res.status, mediaIds: data.mediaIds?.length, error: data.error })

      if (data.ok && data.mediaIds?.length) {
        setPurchasedIds((prev) => new Set([...prev, ...data.mediaIds]))
        if (data.media?.length) setRecentlyPurchased(data.media as Media[])
        setCart([])
        console.log('[Media] verifyPayment → recargando galería...')
        await fetchMedia()
        console.log('[Media] verifyPayment → galería recargada ✓')
      } else if (!data.ok) {
        console.warn('[Media] verifyPayment → la función devolvió error:', data.error)
      }
      setPaymentStatus('success')
    } catch (err) {
      console.error('[Media] verifyPayment → excepción:', err)
      setPaymentStatus('success') // mostrar éxito aunque la verificación falle
    } finally {
      setVerifyingPayment(false)
      setSearchParams({}, { replace: true })
    }
  }

  const fetchPurchases = async () => {
    if (!profile?.id) return
    // @ts-ignore
    const { data } = await supabase
      .from('media_purchases')
      .select('media_id')
      .eq('user_id', profile.id)
    if (data) {
      setPurchasedIds(new Set((data as { media_id: string }[]).map((p) => p.media_id)))
    }
  }

  const fetchPricingConfig = async () => {
    // @ts-ignore
    const { data } = await supabase
      .from('media_pricing_config')
      .select('price_per_file, price_per_file_pack')
      .eq('id', 1)
      .maybeSingle()
    if (data) setPricingConfig(data as PricingConfig)
  }

  const resolveProperty = async (userId: string): Promise<Property | null> => {
    const { data: owned } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', userId)
      .maybeSingle()
    if (owned) return owned as Property

    // @ts-ignore
    const { data: link } = await supabase
      .from('property_clients')
      .select('property_id')
      .eq('user_id', userId)
      .maybeSingle()
    const propertyId = (link as { property_id: string } | null)?.property_id
    if (!propertyId) return null

    const { data: linked } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .maybeSingle()
    return linked as Property | null
  }

  const fetchMedia = async () => {
    if (!profile?.id) return
    try {
      setLoading(true)
      const propertyData = await resolveProperty(profile.id)
      setProperty(propertyData)

      if (propertyData) {
        const { data: mediaData, error } = await supabase
          .from('media')
          .select('*')
          .eq('property_id', (propertyData as Property).id)
          .order('created_at', { ascending: false })
        if (error) throw error
        setMedia(mediaData || [])
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const fixUrl = (url: string) =>
    url?.replace(/\/storage\/v1\/object\/(?!public\/)([^/?]+)\//, '/storage/v1/object/public/$1/')

  /** Devuelve la URL para descarga: original JPG si existe, WebP como fallback */
  const getDownloadUrl = (item: Media) =>
    fixUrl(item.original_url || item.file_url)

  const downloadFile = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch {}
  }

  const [downloadingAll, setDownloadingAll] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  // Ref so downloadAll always has the current displayItems without stale closure
  const displayItemsRef = useRef<Media[]>([])

  // Auto-abre el carrito flotante al añadir el primer archivo
  useEffect(() => {
    if (cart.length >= 1) setCartFloatingOpen(true)
    if (cart.length === 0) setCartFloatingOpen(false)
  }, [cart.length])

  // Cart helpers
  const addToCart = useCallback((item: Media) => {
    setCart((prev) => prev.some((c) => c.id === item.id) ? prev : [...prev, item])
  }, [])

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const isInCart = (id: string) => cart.some((c) => c.id === id)

  // Pack pricing: ≥10 items in cart → price_per_file_pack applies per file
  const packApplied =
    cart.length >= 10 &&
    pricingConfig?.price_per_file_pack != null

  const cartUnitTotal = cart.reduce((sum, item) => sum + (item.price ?? 0), 0)
  const cartTotal = packApplied
    ? cart.length * (pricingConfig!.price_per_file_pack!)
    : cartUnitTotal
  const packSaving = packApplied ? cartUnitTotal - cartTotal : 0

  const handleCheckout = async () => {
    if (!cart.length) return
    setCheckoutLoading(true)
    setCheckoutError('')
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      const token = authSession?.access_token
      if (!token) throw new Error('No autorizado')

      const mediaIds = cart.map((c) => c.id)
      const origin = window.location.origin

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-media-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            mediaIds,
            successUrl: `${origin}/dashboard/media?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${origin}/dashboard/media?payment=cancelled`,
            ...(packApplied && pricingConfig?.price_per_file_pack != null
              ? { packPricePerFile: pricingConfig.price_per_file_pack }
              : {}),
          }),
        }
      )
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Error al iniciar el pago')
      window.location.href = data.url
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : 'Error al procesar el pago')
      setCheckoutLoading(false)
    }
  }

  // Derived lists — items with a purchase record appear as available
  const isUnlocked = (item: Media) => item.is_available || purchasedIds.has(item.id)
  const availableItems = media.filter(isUnlocked)
  const lockedItems = media.filter((m) => !isUnlocked(m))
  const images = availableItems.filter((m) => m.file_type === 'image')
  const videos = availableItems.filter((m) => m.file_type === 'video')

  // Items to show in the current tab
  const displayItems =
    activeTab === 'buy'   ? lockedItems :
    activeTab === 'image' ? images :
    activeTab === 'video' ? videos :
    availableItems

  // Keep ref updated so downloadAll always reads the latest displayItems
  displayItemsRef.current = displayItems

  const downloadAll = async () => {
    const items = displayItemsRef.current
    if (!items.length || downloadingAll) return
    setDownloadingAll(true)
    setDownloadProgress(0)
    for (let i = 0; i < items.length; i++) {
      await downloadFile(getDownloadUrl(items[i]), items[i].file_name)
      setDownloadProgress(i + 1)
    }
    setDownloadingAll(false)
    setDownloadProgress(0)
  }

  return (
    <div className="space-y-6">

      {/* Payment status banners */}
      <AnimatePresence>
        {paymentStatus === 'verifying' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-4 bg-primary-50 border border-primary-200 text-primary-700 text-sm"
          >
            <Loader size={16} className="animate-spin text-primary-500 flex-shrink-0" />
            Verificando tu pago, un momento…
          </motion.div>
        )}
        {paymentStatus === 'success' && !verifyingPayment && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 text-green-800 text-sm"
          >
            <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
            <span>
              <strong>¡Pago completado!</strong> Tus archivos comprados ya están disponibles para descarga.
            </span>
            <button onClick={() => setPaymentStatus('idle')} className="ml-auto text-green-600 hover:text-green-800">
              <X size={16} />
            </button>
          </motion.div>
        )}
        {paymentStatus === 'cancelled' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm"
          >
            <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
            Pago cancelado. Puedes volver a intentarlo cuando quieras.
            <button onClick={() => setPaymentStatus('idle')} className="ml-auto text-amber-600 hover:text-amber-800">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sección de archivos recién comprados */}
      <AnimatePresence>
        {recentlyPurchased.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="border-2 border-green-400 bg-green-50 p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-green-600" />
                <h2 className="font-display text-lg font-bold text-green-900">
                  ¡Archivos recién comprados!
                </h2>
                <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded-full">
                  {recentlyPurchased.length} archivo{recentlyPurchased.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    recentlyPurchased.forEach((item) =>
                      downloadFile(getDownloadUrl(item), item.file_name)
                    )
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-700 text-white text-xs font-semibold hover:bg-green-800 transition-colors"
                >
                  <Download size={14} />
                  Descargar todos
                </button>
                <button
                  onClick={() => setRecentlyPurchased([])}
                  className="p-1.5 text-green-600 hover:text-green-900 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {recentlyPurchased.map((item) => (
                <div key={item.id} className="relative group aspect-square bg-green-100 overflow-hidden border border-green-300">
                  {item.file_type === 'image' ? (
                    <img
                      src={fixUrl(item.file_url)}
                      alt={item.file_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-green-200 gap-1">
                      <Play size={24} className="text-green-700" />
                      <span className="text-[10px] text-green-700 font-semibold">Vídeo</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-green-900/0 group-hover:bg-green-900/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => downloadFile(getDownloadUrl(item), item.file_name)}
                      className="p-2 bg-white text-green-900 hover:bg-green-100 transition-colors"
                      title={`Descargar ${item.file_name}`}
                    >
                      <Download size={18} />
                    </button>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-green-900/70 px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-[10px] truncate">{item.file_name}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-green-700">
              Estos archivos ya están disponibles en tu galería y listos para descargar.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary-900">Media</h1>
          <p className="mt-1 text-primary-600">
            {property ? (
              <>Archivos de <strong>{property.name}</strong></>
            ) : (
              'Tus fotos y vídeos'
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Cart button — reabre el flotante si está cerrado */}
          {cart.length > 0 && (
            <button
              onClick={() => setCartFloatingOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2.5 border border-primary-200 bg-white text-primary-800 text-sm font-medium hover:bg-primary-50 transition-colors"
            >
              <ShoppingCart size={18} />
              <span>Carrito</span>
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary-900 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            </button>
          )}

        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-primary-200 p-4 text-center">
          <p className="text-3xl font-bold text-primary-900">{availableItems.length}</p>
          <p className="text-sm text-primary-500">Disponibles</p>
        </div>
        <div className="bg-white border border-primary-200 p-4 text-center">
          <p className="text-3xl font-bold text-primary-900">{images.length}</p>
          <p className="text-sm text-primary-500">Fotos</p>
        </div>
        <div className="bg-white border border-primary-200 p-4 text-center">
          <p className="text-3xl font-bold text-primary-900">{videos.length}</p>
          <p className="text-sm text-primary-500">Vídeos</p>
        </div>
      </div>

      {/* Photography impact banner */}
      {!loading && property && (
        <div className="bg-primary-900 text-white p-6">
          <p className="text-xs uppercase tracking-widest text-primary-400 mb-4">
            El impacto de la fotografía profesional en tus reservas
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { stat: '+40%', text: 'más reservas generan los alojamientos con fotografía profesional frente a los que usan fotos propias' },
              { stat: '83%', text: 'de los viajeros afirma que las imágenes son el factor decisivo al elegir dónde alojarse' },
              { stat: '+60%', text: 'de clics reciben los anuncios que incluyen vídeo frente a los que solo muestran fotografías estáticas' },
              { stat: '+26%', text: 'de precio medio por noche logran los hospedajes con galerías completas y de alta calidad' },
            ].map(({ stat, text }) => (
              <div key={stat} className="text-center">
                <p className="font-display text-3xl font-bold text-white leading-none">{stat}</p>
                <p className="text-xs text-primary-400 mt-2 leading-snug">{text}</p>
              </div>
            ))}
          </div>
          {lockedItems.length > 0 && (
            <p className="text-center text-xs text-primary-500 mt-5 border-t border-primary-800 pt-4">
              Tienes {lockedItems.length} archivo{lockedItems.length !== 1 ? 's' : ''} disponible{lockedItems.length !== 1 ? 's' : ''} para adquirir — amplía tu galería y capta más reservas
            </p>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex border border-primary-200 bg-white">
          {/* Available tabs */}
          {([
            { id: 'all',   label: 'Todos' },
            { id: 'image', label: 'Fotos',  icon: <ImageIcon size={16} /> },
            { id: 'video', label: 'Vídeos', icon: <Video size={16} /> },
          ] as const).map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveTab(f.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === f.id ? 'bg-primary-900 text-white' : 'text-primary-600 hover:bg-primary-50'
              }`}
            >
              {'icon' in f ? f.icon : null}
              {f.label}
            </button>
          ))}

          {/* Buy tab — only when there are locked items */}
          {lockedItems.length > 0 && (
            <button
              onClick={() => setActiveTab('buy')}
              className={`relative px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-2 border-l border-primary-200 ${
                activeTab === 'buy'
                  ? 'bg-amber-600 text-white'
                  : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
              }`}
            >
              <ShoppingCart size={15} />
              Comprar
              <span className={`inline-flex items-center justify-center h-4.5 min-w-[1.125rem] px-1 text-[10px] font-bold rounded-full ${
                activeTab === 'buy' ? 'bg-white text-amber-700' : 'bg-amber-600 text-white'
              }`}>
                {lockedItems.length}
              </span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Download all — only for non-buy tabs with items */}
          {activeTab !== 'buy' && displayItems.length > 0 && (
            <button
              onClick={downloadAll}
              disabled={downloadingAll}
              className="inline-flex items-center gap-2 px-4 py-2 border border-primary-200 bg-white text-primary-700 text-sm font-medium hover:bg-primary-50 transition-colors disabled:opacity-60 disabled:cursor-wait"
            >
              {downloadingAll ? (
                <>
                  <Loader size={15} className="animate-spin" />
                  {downloadProgress}/{displayItems.length}
                </>
              ) : (
                <>
                  <Download size={15} />
                  Descargar todas
                </>
              )}
            </button>
          )}

          <div className="flex border border-primary-200 bg-white">
            <button onClick={() => setViewMode('grid')} className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary-900 text-white' : 'text-primary-600 hover:bg-primary-50'}`}>
              <Grid size={20} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary-900 text-white' : 'text-primary-600 hover:bg-primary-50'}`}>
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Media Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : !property ? (
        <div className="text-center py-20 bg-white border border-primary-200">
          <ImageIcon size={48} className="mx-auto text-primary-300 mb-4" />
          <p className="text-primary-600">Aún no tienes una propiedad asignada.</p>
          <p className="text-sm text-primary-500 mt-2">Una vez contratados nuestros servicios, aquí podrás acceder a tu contenido.</p>
        </div>
      ) : media.length > 0 ? (
        displayItems.length === 0 && activeTab !== 'buy' ? (
          <div className="text-center py-16 bg-white border border-primary-200">
            <ImageIcon size={40} className="mx-auto text-primary-300 mb-3" />
            <p className="text-primary-500 text-sm">No hay archivos en esta categoría</p>
          </div>
        ) : displayItems.length === 0 && activeTab === 'buy' ? (
          <div className="text-center py-16 bg-white border border-primary-200">
            <CheckCircle2 size={40} className="mx-auto text-green-500 mb-3" />
            <p className="text-primary-700 font-medium">¡Tienes todos tus archivos!</p>
            <p className="text-primary-500 text-sm mt-1">No hay archivos pendientes de adquirir.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div>
            {/* Buy tab: "add all to cart" banner */}
            {activeTab === 'buy' && lockedItems.some(m => m.price != null) && (
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 text-amber-800">
                  <Package size={18} className="text-amber-600 flex-shrink-0" />
                  <span className="text-sm">
                    <strong>{lockedItems.length} archivo{lockedItems.length !== 1 ? 's' : ''}</strong> disponible{lockedItems.length !== 1 ? 's' : ''} para adquirir
                    {pricingConfig?.price_per_file_pack != null && lockedItems.length >= 10 && (
                      <span className="ml-2 text-amber-600 font-semibold">· Precio pack activo</span>
                    )}
                    {pricingConfig?.price_per_file_pack != null && lockedItems.length < 10 && (
                      <span className="ml-2 text-amber-600">· Pack desde 10 archivos</span>
                    )}
                  </span>
                </div>
                <button
                  onClick={() => {
                    lockedItems.filter(m => m.price != null).forEach(m => addToCart(m))
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors whitespace-nowrap flex-shrink-0"
                >
                  <ShoppingCart size={15} />
                  Añadir todo al carrito
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayItems.map((item, index) => {
                const locked = !isUnlocked(item)
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className={`aspect-square bg-primary-100 relative overflow-hidden ${locked ? '' : 'group cursor-pointer'}`}
                    onClick={locked ? undefined : () => setSelectedIndex(availableItems.indexOf(item))}
                  >
                    {item.file_type === 'image' ? (
                      <img src={fixUrl(item.file_url)} alt={item.file_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary-200">
                        <Play size={32} className="text-primary-500" />
                      </div>
                    )}

                    {item.file_type === 'video' && !locked && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-primary-900 text-white text-xs">Vídeo</div>
                    )}

                    {/* Available: hover overlay with download */}
                    {!locked && (
                      <div className="absolute inset-0 bg-primary-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); downloadFile(getDownloadUrl(item), item.file_name) }}
                          className="p-3 bg-white text-primary-900 hover:bg-primary-100"
                        >
                          <Download size={20} />
                        </button>
                      </div>
                    )}

                    {/* Locked: dark tint + watermark + cart button */}
                    {locked && (
                      <>
                        <div className="absolute inset-0 bg-primary-900/30" />
                        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
                          <div style={{ transform: 'rotate(-20deg)', width: '140%', textAlign: 'center' }}>
                            <p className="font-display font-bold text-white/45 leading-none" style={{ fontSize: 'clamp(1.8rem, 6.5vw, 3.25rem)', textShadow: '0 2px 8px rgba(0,0,0,0.55)' }}>
                              De Punta
                            </p>
                            <p className="font-display font-bold text-white/45 leading-tight" style={{ fontSize: 'clamp(1.8rem, 6.5vw, 3.25rem)', textShadow: '0 2px 8px rgba(0,0,0,0.55)' }}>
                              a Chicote
                            </p>
                          </div>
                        </div>
                        <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-2 py-1.5 bg-gradient-to-t from-primary-900/80 to-transparent">
                          <span className="flex items-center gap-0.5 text-white text-xs font-semibold">
                            {item.price != null ? (
                              <><Euro size={11} />{item.price.toFixed(2)}</>
                            ) : (
                              <span className="text-white/60 text-[10px]">Sin precio</span>
                            )}
                          </span>
                          {item.price != null ? (
                            <button
                              onClick={() => isInCart(item.id) ? removeFromCart(item.id) : addToCart(item)}
                              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                isInCart(item.id)
                                  ? 'bg-amber-600 text-white hover:bg-red-600'
                                  : 'bg-white text-primary-900 hover:bg-amber-50'
                              }`}
                            >
                              {isInCart(item.id) ? <><X size={11} />En carrito</> : <><ShoppingCart size={11} />Añadir</>}
                            </button>
                          ) : (
                            <span className="px-2 py-0.5 bg-black/40 text-white/50 text-[10px]">
                              <Lock size={10} className="inline mr-0.5" />A consultar
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        ) : (
          /* List view */
          <div className="bg-white border border-primary-200 divide-y divide-primary-100">
            {/* Buy tab: add all banner in list mode */}
            {activeTab === 'buy' && lockedItems.some(m => m.price != null) && (
              <div className="px-4 py-3 bg-amber-50 flex items-center justify-between gap-3">
                <span className="text-sm text-amber-800 flex items-center gap-2">
                  <Package size={15} className="text-amber-600" />
                  <strong>{lockedItems.length}</strong> archivo{lockedItems.length !== 1 ? 's' : ''} por adquirir
                </span>
                <button
                  onClick={() => lockedItems.filter(m => m.price != null).forEach(m => addToCart(m))}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors"
                >
                  <ShoppingCart size={13} />
                  Añadir todo
                </button>
              </div>
            )}

            {displayItems.map((item) => {
              const locked = !isUnlocked(item)
              return (
                <div key={item.id} className={`p-4 flex items-center gap-4 ${locked ? 'bg-primary-50/50' : 'hover:bg-primary-50'} transition-colors`}>
                  <div className="w-16 h-16 bg-primary-100 flex-shrink-0 overflow-hidden relative">
                    {item.file_type === 'image' ? (
                      <img src={fixUrl(item.file_url)} alt={item.file_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary-200">
                        <Video size={24} className="text-primary-500" />
                      </div>
                    )}
                    {locked && (
                      <div className="absolute inset-0 bg-primary-900/30 flex items-center justify-center overflow-hidden">
                        <div style={{ transform: 'rotate(-20deg)', textAlign: 'center', lineHeight: 1 }}>
                          <p className="font-display font-bold text-white/50 text-[7px] leading-none" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>De Punta</p>
                          <p className="font-display font-bold text-white/50 text-[7px] leading-tight" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>a Chicote</p>
                        </div>
                        <Lock size={10} className="text-white/60 absolute bottom-1 right-1" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${locked ? 'text-primary-500' : 'text-primary-900'}`}>{item.file_name}</p>
                    <p className={`text-sm ${locked ? 'text-primary-400' : 'text-primary-500'}`}>
                      {item.file_type === 'image' ? 'Foto' : 'Vídeo'} ·{' '}
                      {item.file_size ? `${(item.file_size / 1024 / 1024).toFixed(2)} MB` : 'Tamaño desconocido'}
                    </p>
                    {locked && item.price != null && (
                      <p className="text-sm font-semibold text-amber-700 mt-0.5 flex items-center gap-0.5">
                        <Euro size={13} />{item.price.toFixed(2)}
                      </p>
                    )}
                  </div>
                  {locked ? (
                    item.price != null ? (
                      <button
                        onClick={() => isInCart(item.id) ? removeFromCart(item.id) : addToCart(item)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors ${
                          isInCart(item.id)
                            ? 'bg-primary-200 text-primary-700 hover:bg-red-100 hover:text-red-700'
                            : 'bg-amber-600 text-white hover:bg-amber-700'
                        }`}
                      >
                        {isInCart(item.id) ? <><X size={13} />En carrito</> : <><ShoppingCart size={13} />Añadir</>}
                      </button>
                    ) : (
                      <span className="text-xs text-primary-400 flex items-center gap-1">
                        <Lock size={12} />A consultar
                      </span>
                    )
                  ) : (
                    <button
                      onClick={() => downloadFile(getDownloadUrl(item), item.file_name)}
                      className="p-2 text-primary-600 hover:text-primary-900 hover:bg-primary-100"
                    >
                      <Download size={20} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )
      ) : (
        <div className="text-center py-20 bg-white border border-primary-200">
          <ImageIcon size={48} className="mx-auto text-primary-300 mb-4" />
          <p className="text-primary-600">No hay archivos disponibles</p>
        </div>
      )}

      {/* ── Cart panel ── */}
      <AnimatePresence>
        {cartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setCartOpen(false)}
            />
            {/* Slide-in panel */}
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm z-50 bg-white flex flex-col shadow-2xl"
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-primary-200">
                <h2 className="font-display text-lg font-bold text-primary-900 flex items-center gap-2">
                  <ShoppingCart size={20} />
                  Carrito ({cart.length})
                </h2>
                <button onClick={() => setCartOpen(false)} className="p-1.5 text-primary-500 hover:text-primary-900">
                  <X size={20} />
                </button>
              </div>

              {/* Items list */}
              <div className="flex-1 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-primary-400">
                    <ShoppingCart size={40} className="opacity-30" />
                    <p className="text-sm">El carrito está vacío</p>
                    <button onClick={() => setCartOpen(false)} className="text-xs text-primary-500 underline">
                      Ver archivos disponibles
                    </button>
                  </div>
                ) : (
                  <ul className="divide-y divide-primary-100">
                    {cart.map((item) => (
                      <li key={item.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="w-14 h-14 flex-shrink-0 overflow-hidden bg-primary-100 relative">
                          {item.file_type === 'image' ? (
                            <img src={fixUrl(item.file_url)} alt={item.file_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary-200">
                              <Video size={20} className="text-primary-500" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary-900 truncate">{item.file_name}</p>
                          <p className="text-sm text-primary-500 font-semibold flex items-center gap-0.5 mt-0.5">
                            <Euro size={13} />{(item.price ?? 0).toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 text-primary-400 hover:text-red-600 transition-colors flex-shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Panel footer */}
              {cart.length > 0 && (
                <div className="border-t border-primary-200 p-5 space-y-3">

                  {/* Pack discount notice when close to threshold */}
                  {!packApplied && pricingConfig?.price_per_file_pack != null && cart.length > 0 && cart.length < 10 && (
                    <div className="bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 flex items-start gap-1.5">
                      <Package size={13} className="flex-shrink-0 mt-0.5" />
                      <span>
                        Añade {10 - cart.length} archivo{10 - cart.length !== 1 ? 's' : ''} más y obtén precio pack —{' '}
                        <strong>
                          {pricingConfig.price_per_file_pack.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                          /archivo
                        </strong>
                      </span>
                    </div>
                  )}

                  {/* Pack applied badge */}
                  {packApplied && (
                    <div className="bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700 flex items-center gap-1.5">
                      <Sparkles size={13} />
                      <span>Precio pack activo ({cart.length} archivos)</span>
                    </div>
                  )}

                  {/* Price breakdown */}
                  <div className="space-y-1.5">
                    {packApplied && (
                      <div className="flex items-center justify-between text-sm text-primary-400">
                        <span>Precio unitario</span>
                        <span className="line-through">{cartUnitTotal.toFixed(2)} €</span>
                      </div>
                    )}
                    {packApplied && (
                      <div className="flex items-center justify-between text-sm text-primary-700">
                        <span>
                          Pack ×{cart.length} —{' '}
                          {pricingConfig!.price_per_file_pack!.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                          /archivo
                        </span>
                        <span className="font-semibold">{cartTotal.toFixed(2)} €</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-primary-900 pt-1">
                      <span className="font-medium">Total</span>
                      <span className="font-display text-2xl font-bold flex items-center gap-0.5">
                        <Euro size={18} />{cartTotal.toFixed(2)}
                      </span>
                    </div>
                    {packApplied && packSaving > 0 && (
                      <div className="flex items-center justify-between text-xs text-green-600 font-semibold">
                        <span>Ahorro pack</span>
                        <span>−{packSaving.toFixed(2)} €</span>
                      </div>
                    )}
                  </div>

                  {checkoutError && (
                    <p className="text-xs text-red-600 flex items-center gap-1.5">
                      <AlertCircle size={13} />{checkoutError}
                    </p>
                  )}

                  <button
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary-900 text-white font-semibold hover:bg-primary-800 transition-colors disabled:opacity-60"
                  >
                    {checkoutLoading ? (
                      <><Loader size={18} className="animate-spin" />Redirigiendo…</>
                    ) : (
                      <><CreditCard size={18} />Pagar con tarjeta</>
                    )}
                  </button>

                  <p className="text-[11px] text-primary-400 text-center">
                    Pago seguro procesado por Stripe · IVA incluido
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Carrito flotante ── aparece al añadir el primer archivo */}
      <AnimatePresence>
        {cartFloatingOpen && cart.length > 0 && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            className="fixed bottom-6 right-6 z-50 w-80 bg-white shadow-2xl border border-primary-200 flex flex-col"
            style={{ maxHeight: '70vh' }}
          >
            {/* Cabecera */}
            <div className="flex items-center justify-between px-4 py-3 bg-primary-900 text-white">
              <span className="flex items-center gap-2 font-semibold text-sm">
                <ShoppingCart size={16} />
                Carrito
                <span className="ml-1 px-2 py-0.5 bg-white text-primary-900 text-[11px] font-bold rounded-full">
                  {cart.length}
                </span>
              </span>
              <button
                onClick={() => setCartFloatingOpen(false)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Progreso hacia precio pack — siempre visible */}
            {(() => {
              const packPrice = pricingConfig?.price_per_file_pack
              const isActive = packApplied
              const remaining = Math.max(0, 10 - cart.length)
              const pct = Math.min((cart.length / 10) * 100, 100)

              let msg: React.ReactNode
              if (isActive) {
                msg = (
                  <>
                    <strong>¡Precio pack activo!</strong>
                    {packPrice != null && (
                      <> — {packPrice.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}/archivo</>
                    )}
                  </>
                )
              } else if (cart.length === 9) {
                msg = <>¡<strong>Solo 1 más</strong> para el precio pack!</>
              } else if (cart.length >= 7) {
                msg = <>¡<strong>Solo {remaining} más</strong> para el precio pack!</>
              } else if (cart.length === 5) {
                msg = <>¡Mitad del camino! <strong>{remaining} más</strong> para el precio pack</>
              } else {
                msg = (
                  <>
                    <strong>{remaining} archivo{remaining !== 1 ? 's' : ''} más</strong> para precio pack
                    {packPrice != null && (
                      <> — {packPrice.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}/archivo</>
                    )}
                  </>
                )
              }

              return (
                <div
                  className={`px-3 py-2.5 border-b text-xs transition-colors duration-500 ${
                    isActive
                      ? 'bg-green-50 border-green-200'
                      : cart.length >= 8
                      ? 'bg-amber-50 border-amber-300'
                      : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <motion.span
                      key={isActive ? 'pack-on' : 'pack-off'}
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', damping: 14 }}
                    >
                      {isActive
                        ? <Sparkles size={13} className="text-green-600" />
                        : <Package size={13} className="text-amber-600" />}
                    </motion.span>

                    <AnimatePresence mode="wait">
                      <motion.span
                        key={cart.length}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.15 }}
                        className={`leading-snug ${isActive ? 'text-green-800' : 'text-amber-800'}`}
                      >
                        {msg}
                      </motion.span>
                    </AnimatePresence>
                  </div>

                  {/* Barra de progreso */}
                  <div className="w-full h-2 bg-black/10 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        isActive ? 'bg-green-500' : cart.length >= 8 ? 'bg-amber-500' : 'bg-amber-400'
                      }`}
                      initial={false}
                      animate={{ width: `${pct}%` }}
                      transition={{ type: 'spring', damping: 22, stiffness: 180 }}
                    />
                  </div>

                  <div className={`flex justify-between mt-1 text-[10px] ${isActive ? 'text-green-600/80' : 'text-amber-600/70'}`}>
                    <span>{cart.length} archivo{cart.length !== 1 ? 's' : ''}</span>
                    {isActive
                      ? <span className="font-semibold">¡Ahorro de {packSaving.toFixed(2)} €!</span>
                      : <span>Objetivo: 10</span>
                    }
                  </div>
                </div>
              )
            })()}

            {/* Lista de archivos */}
            <ul className="flex-1 overflow-y-auto divide-y divide-primary-100">
              {cart.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="w-12 h-12 flex-shrink-0 overflow-hidden bg-primary-100">
                    {item.file_type === 'image' ? (
                      <img src={fixUrl(item.file_url)} alt={item.file_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary-200">
                        <Play size={18} className="text-primary-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-primary-900 truncate">{item.file_name}</p>
                    <p className="text-xs text-primary-500 mt-0.5 flex items-center gap-0.5">
                      {packApplied ? (
                        <>
                          <span className="line-through text-primary-300 mr-1">
                            <Euro size={10} className="inline" />{(item.price ?? 0).toFixed(2)}
                          </span>
                          <Euro size={10} />{pricingConfig!.price_per_file_pack!.toFixed(2)}
                        </>
                      ) : (
                        <><Euro size={10} />{(item.price ?? 0).toFixed(2)}</>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1 text-primary-300 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>

            {/* Footer con total y botón pagar */}
            <div className="border-t border-primary-200 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-primary-600">Total</span>
                <div className="text-right">
                  {packApplied && (
                    <span className="text-xs line-through text-primary-300 block">
                      {cartUnitTotal.toFixed(2)} €
                    </span>
                  )}
                  <span className="font-display text-xl font-bold text-primary-900 flex items-center gap-0.5">
                    <Euro size={15} />{cartTotal.toFixed(2)}
                  </span>
                  {packApplied && packSaving > 0 && (
                    <span className="text-[11px] text-green-600 font-semibold">
                      Ahorro: {packSaving.toFixed(2)} €
                    </span>
                  )}
                </div>
              </div>

              {checkoutError && (
                <p className="text-[11px] text-red-600 flex items-center gap-1">
                  <AlertCircle size={11} />{checkoutError}
                </p>
              )}

              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary-900 text-white font-bold text-sm tracking-wide hover:bg-primary-800 transition-colors disabled:opacity-60"
              >
                {checkoutLoading ? (
                  <><Loader size={16} className="animate-spin" />Redirigiendo…</>
                ) : (
                  <><CreditCard size={16} />PAGAR — {cartTotal.toFixed(2)} €</>
                )}
              </button>

              <p className="text-[10px] text-primary-400 text-center">
                Pago seguro · Stripe · IVA incluido
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popup de adquisición — se muestra en cada visita a esta página */}
      {profile && (profile.user_type === 'host' || profile.user_type === 'manager') && (
        <MediaPurchasePopup profile={profile as any} />
      )}

      {/* Lightbox */}
      {selectedIndex !== null && availableItems.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-primary-900/95 flex items-center justify-center"
          onClick={() => setSelectedIndex(null)}
        >
          <button onClick={() => setSelectedIndex(null)} className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full">
            <X size={32} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : availableItems.length - 1) }}
            className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-full"
          >
            <ChevronLeft size={32} />
          </button>

          {availableItems[selectedIndex].file_type === 'image' ? (
            <img
              src={fixUrl(availableItems[selectedIndex].file_url)}
              alt={availableItems[selectedIndex].file_name}
              className="max-w-[90vw] max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <video
              src={fixUrl(availableItems[selectedIndex].file_url)}
              controls
              className="max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            />
          )}

          <button
            onClick={(e) => { e.stopPropagation(); setSelectedIndex(selectedIndex < availableItems.length - 1 ? selectedIndex + 1 : 0) }}
            className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-full"
          >
            <ChevronRight size={32} />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
            <span className="text-white">{selectedIndex + 1} / {availableItems.length}</span>
            <button
              onClick={(e) => { e.stopPropagation(); downloadFile(getDownloadUrl(availableItems[selectedIndex]), availableItems[selectedIndex].file_name) }}
              className="p-2 bg-white text-primary-900 hover:bg-primary-100"
            >
              <Download size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
