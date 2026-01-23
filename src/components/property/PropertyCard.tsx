import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Star, ExternalLink } from 'lucide-react'
import type { Property } from '../../types/database'

interface PropertyCardProps {
  property: Property
  rank?: number
  showRank?: boolean
}

export default function PropertyCard({ property, rank, showRank = true }: PropertyCardProps) {
  const ratings = [property.google_rating, property.booking_rating, property.airbnb_rating].filter(
    (r): r is number => r !== null && r !== undefined
  )
  const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0

  return (
    <Link to={`/hospedaje/${property.slug}`}>
      <motion.article
        whileHover={{ y: -5 }}
        className="group bg-white border border-primary-200 hover:border-primary-900 transition-all duration-300"
      >
        {/* Image */}
        <div className="aspect-[4/3] relative overflow-hidden bg-primary-100">
          {showRank && rank && (
            <div className="absolute top-4 left-4 z-10 w-10 h-10 bg-primary-900 text-white flex items-center justify-center font-display font-bold text-lg">
              {rank}
            </div>
          )}

          {property.cover_image ? (
            <img
              src={property.cover_image}
              alt={property.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary-100">
              <span className="text-primary-400">Sin imagen</span>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-primary-900/0 group-hover:bg-primary-900/10 transition-colors duration-300 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileHover={{ opacity: 1, scale: 1 }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ExternalLink size={32} className="text-white drop-shadow-lg" />
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center gap-2 text-sm text-primary-500 mb-2">
            <MapPin size={14} />
            <span>
              {property.city}, {property.province}
            </span>
          </div>

          <h3 className="font-display text-xl font-semibold text-primary-900 group-hover:underline decoration-1 underline-offset-4">
            {property.name}
          </h3>

          {property.short_description && (
            <p className="mt-2 text-sm text-primary-600 line-clamp-2">
              {property.short_description}
            </p>
          )}

          {/* Ratings - Solo mostrar si hay valoraciones o tipo de propiedad */}
          <div className="mt-4 flex items-center justify-between">
            {ratings.length > 0 ? (
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={
                      i < Math.round(averageRating)
                        ? 'fill-primary-900 text-primary-900'
                        : 'text-primary-300'
                    }
                  />
                ))}
                <span className="ml-2 text-sm font-medium text-primary-900">
                  {averageRating.toFixed(1)}
                </span>
              </div>
            ) : (
              <div /> // Placeholder para mantener flex justify-between
            )}

            {property.property_type && (
              <span className="text-xs px-2 py-1 bg-primary-100 text-primary-600">
                {property.property_type}
              </span>
            )}
          </div>

          {/* Platform ratings - Solo mostrar si hay al menos una valoracion */}
          {(property.google_rating || property.booking_rating || property.airbnb_rating) && (
            <div className="mt-4 pt-4 border-t border-primary-100 flex items-center gap-4 text-xs text-primary-500">
              {property.google_rating && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">Google:</span>
                  <span>{property.google_rating}</span>
                </div>
              )}
              {property.booking_rating && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">Booking:</span>
                  <span>{property.booking_rating}</span>
                </div>
              )}
              {property.airbnb_rating && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">Airbnb:</span>
                  <span>{property.airbnb_rating}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.article>
    </Link>
  )
}
