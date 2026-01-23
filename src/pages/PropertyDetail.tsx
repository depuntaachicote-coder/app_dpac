import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Star,
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  ExternalLink,
  Wifi,
  Car,
  Coffee,
  Waves,
  Mountain,
  Utensils,
} from 'lucide-react'
import { useProperty } from '../hooks/useProperties'
import { supabase } from '../lib/supabase'
import type { Media } from '../types/database'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const amenityIcons: Record<string, React.ElementType> = {
  wifi: Wifi,
  parking: Car,
  breakfast: Coffee,
  pool: Waves,
  mountain_view: Mountain,
  restaurant: Utensils,
}

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const { property, loading, error } = useProperty(id || '')
  const [media, setMedia] = useState<Media[]>([])
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null)

  useEffect(() => {
    const fetchMedia = async () => {
      if (!property?.id) return

      const { data } = await supabase
        .from('media')
        .select('*')
        .eq('property_id', property.id)
        .order('order_index')

      if (data) setMedia(data)
    }

    fetchMedia()
  }, [property?.id])

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-display font-bold text-primary-900">
          Hospedaje no encontrado
        </h1>
        <Link to="/ranking" className="mt-4 text-primary-600 hover:text-primary-900">
          Volver al ranking
        </Link>
      </div>
    )
  }

  const images = media.filter((m) => m.file_type === 'image')
  const videos = media.filter((m) => m.file_type === 'video')

  const ratings = [property.google_rating, property.booking_rating, property.airbnb_rating].filter(
    (r): r is number => r !== null && r !== undefined
  )
  const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0

  return (
    <div className="min-h-screen pt-20 bg-white">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link
          to="/ranking"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-900 transition-colors"
        >
          <ChevronLeft size={20} />
          Volver al ranking
        </Link>
      </div>

      {/* Hero Image Gallery */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {/* Main Image */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="aspect-[4/3] lg:aspect-square relative cursor-pointer group"
            onClick={() => setSelectedMediaIndex(0)}
          >
            {property.cover_image || images[0] ? (
              <img
                src={property.cover_image || images[0]?.file_url}
                alt={property.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-400">Sin imagen</span>
              </div>
            )}
            <div className="absolute inset-0 bg-primary-900/0 group-hover:bg-primary-900/20 transition-colors" />
            {property.ranking_position && (
              <div className="absolute top-4 left-4 w-12 h-12 bg-primary-900 text-white flex items-center justify-center font-display font-bold text-xl">
                #{property.ranking_position}
              </div>
            )}
          </motion.div>

          {/* Secondary Images */}
          <div className="hidden lg:grid grid-cols-2 gap-2">
            {images.slice(1, 5).map((img, index) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: (index + 1) * 0.1 }}
                className="aspect-square relative cursor-pointer group"
                onClick={() => setSelectedMediaIndex(index + 1)}
              >
                <img
                  src={img.file_url}
                  alt={`${property.name} - ${index + 2}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-primary-900/0 group-hover:bg-primary-900/20 transition-colors" />
                {index === 3 && images.length > 5 && (
                  <div className="absolute inset-0 bg-primary-900/60 flex items-center justify-center">
                    <span className="text-white font-medium">+{images.length - 5} fotos</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile gallery indicator */}
        {images.length > 1 && (
          <button
            onClick={() => setSelectedMediaIndex(0)}
            className="lg:hidden mt-4 w-full py-3 border border-primary-200 text-primary-600 text-sm"
          >
            Ver {images.length} fotos
          </button>
        )}
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Location & Type */}
              <div className="flex items-center gap-4 text-sm text-primary-500 mb-4">
                <span className="flex items-center gap-1">
                  <MapPin size={16} />
                  {property.city}, {property.province}
                </span>
                {property.property_type && (
                  <>
                    <span className="w-1 h-1 bg-primary-400 rounded-full" />
                    <span>{property.property_type}</span>
                  </>
                )}
              </div>

              {/* Title */}
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-900">
                {property.name}
              </h1>

              {/* Ratings - Solo mostrar si hay valoraciones */}
              {ratings.length > 0 && (
                <div className="mt-6 flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={
                          i < Math.round(averageRating)
                            ? 'fill-primary-900 text-primary-900'
                            : 'text-primary-300'
                        }
                      />
                    ))}
                    <span className="ml-2 text-lg font-medium text-primary-900">
                      {averageRating.toFixed(1)}
                    </span>
                  </div>
                </div>
              )}

              {/* Platform Ratings - Solo mostrar si hay al menos una valoracion */}
              {(property.google_rating || property.booking_rating || property.airbnb_rating) && (
              <div className="mt-6 flex flex-wrap gap-4">
                {property.google_rating && (
                  <div className="px-4 py-2 bg-primary-50 border border-primary-200">
                    <span className="text-xs text-primary-500 block">Google</span>
                    <span className="font-medium text-primary-900">
                      {property.google_rating}{' '}
                      {property.google_reviews_count && (
                        <span className="text-sm text-primary-500">
                          ({property.google_reviews_count} reseñas)
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {property.booking_rating && (
                  <div className="px-4 py-2 bg-primary-50 border border-primary-200">
                    <span className="text-xs text-primary-500 block">Booking</span>
                    <span className="font-medium text-primary-900">
                      {property.booking_rating}{' '}
                      {property.booking_reviews_count && (
                        <span className="text-sm text-primary-500">
                          ({property.booking_reviews_count} reseñas)
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {property.airbnb_rating && (
                  <div className="px-4 py-2 bg-primary-50 border border-primary-200">
                    <span className="text-xs text-primary-500 block">Airbnb</span>
                    <span className="font-medium text-primary-900">
                      {property.airbnb_rating}{' '}
                      {property.airbnb_reviews_count && (
                        <span className="text-sm text-primary-500">
                          ({property.airbnb_reviews_count} reseñas)
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
              )}

              {/* Description */}
              {property.description && (
                <div className="mt-10">
                  <h2 className="font-display text-xl font-semibold text-primary-900 mb-4">
                    Sobre este hospedaje
                  </h2>
                  <div className="prose prose-primary max-w-none">
                    <p className="text-primary-600 leading-relaxed whitespace-pre-line">
                      {property.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div className="mt-10">
                  <h2 className="font-display text-xl font-semibold text-primary-900 mb-4">
                    Servicios
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {property.amenities.map((amenity) => {
                      const Icon = amenityIcons[amenity.toLowerCase()] || Star
                      return (
                        <div
                          key={amenity}
                          className="flex items-center gap-3 p-3 border border-primary-200"
                        >
                          <Icon size={20} className="text-primary-600" />
                          <span className="text-primary-800">{amenity}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Videos */}
              {videos.length > 0 && (
                <div className="mt-10">
                  <h2 className="font-display text-xl font-semibold text-primary-900 mb-4">
                    Vídeos
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {videos.map((video) => (
                      <div
                        key={video.id}
                        className="aspect-video relative bg-primary-100 cursor-pointer group"
                      >
                        {video.thumbnail_url ? (
                          <img
                            src={video.thumbnail_url}
                            alt="Video thumbnail"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play size={48} className="text-primary-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-primary-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                            <Play size={24} className="text-primary-900 ml-1" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-28 space-y-6"
            >
              {/* Location Card */}
              <div className="border border-primary-200 p-6">
                <h3 className="font-display text-lg font-semibold text-primary-900 mb-4">
                  Ubicación
                </h3>
                <p className="text-primary-600 mb-4">
                  {property.address}
                  <br />
                  {property.postal_code && `${property.postal_code}, `}
                  {property.city}, {property.province}
                </p>
                {property.latitude && property.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${property.latitude},${property.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary-900 hover:underline"
                  >
                    Ver en Google Maps
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>

              {/* CTA Card */}
              <div className="border border-primary-900 p-6 bg-primary-50">
                <h3 className="font-display text-lg font-semibold text-primary-900 mb-2">
                  ¿Tienes un hospedaje?
                </h3>
                <p className="text-primary-600 text-sm mb-4">
                  Únete a los mejores hospedajes de Galicia y potencia tu visibilidad.
                </p>
                <Link to="/registro" className="btn-primary w-full text-center block">
                  Solicitar información
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedMediaIndex !== null && images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-primary-900/95 flex items-center justify-center"
            onClick={() => setSelectedMediaIndex(null)}
          >
            <button
              onClick={() => setSelectedMediaIndex(null)}
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={32} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedMediaIndex(
                  selectedMediaIndex > 0 ? selectedMediaIndex - 1 : images.length - 1
                )
              }}
              className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronLeft size={32} />
            </button>

            <motion.img
              key={selectedMediaIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              src={images[selectedMediaIndex]?.file_url}
              alt={`${property.name} - ${selectedMediaIndex + 1}`}
              className="max-w-[90vw] max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedMediaIndex(
                  selectedMediaIndex < images.length - 1 ? selectedMediaIndex + 1 : 0
                )
              }}
              className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronRight size={32} />
            </button>

            <div className="absolute bottom-4 text-white text-sm">
              {selectedMediaIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
