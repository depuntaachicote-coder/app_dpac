import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ChevronLeft,
  Save,
  MapPin,
  Star,
  Image as ImageIcon,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const propertyTypes = ['Hotel', 'Casa Rural', 'Apartamento', 'Hostal', 'Pazo', 'Otro']
const provinces = ['A Coruña', 'Lugo', 'Ourense', 'Pontevedra']

export default function AdminPropertyEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    address: '',
    city: '',
    province: 'Pontevedra',
    postal_code: '',
    latitude: '',
    longitude: '',
    google_rating: '',
    google_reviews_count: '',
    booking_rating: '',
    booking_reviews_count: '',
    airbnb_rating: '',
    airbnb_reviews_count: '',
    property_type: 'Casa Rural',
    amenities: [] as string[],
    cover_image: '',
    is_featured: false,
    is_active: true,
    ranking_position: '',
  })

  useEffect(() => {
    if (isEditing && id) {
      fetchProperty(id)
    }
  }, [id, isEditing])

  const fetchProperty = async (propertyId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single()

      if (error) throw error

      if (data) {
        const prop = data as {
          name: string
          slug: string
          description: string | null
          short_description: string | null
          address: string
          city: string
          province: string
          postal_code: string | null
          latitude: number | null
          longitude: number | null
          google_rating: number | null
          google_reviews_count: number | null
          booking_rating: number | null
          booking_reviews_count: number | null
          airbnb_rating: number | null
          airbnb_reviews_count: number | null
          property_type: string
          amenities: string[] | null
          cover_image: string | null
          is_featured: boolean
          is_active: boolean
          ranking_position: number | null
        }
        setFormData({
          name: prop.name,
          slug: prop.slug,
          description: prop.description || '',
          short_description: prop.short_description || '',
          address: prop.address,
          city: prop.city,
          province: prop.province,
          postal_code: prop.postal_code || '',
          latitude: prop.latitude?.toString() || '',
          longitude: prop.longitude?.toString() || '',
          google_rating: prop.google_rating?.toString() || '',
          google_reviews_count: prop.google_reviews_count?.toString() || '',
          booking_rating: prop.booking_rating?.toString() || '',
          booking_reviews_count: prop.booking_reviews_count?.toString() || '',
          airbnb_rating: prop.airbnb_rating?.toString() || '',
          airbnb_reviews_count: prop.airbnb_reviews_count?.toString() || '',
          property_type: prop.property_type,
          amenities: prop.amenities || [],
          cover_image: prop.cover_image || '',
          is_featured: prop.is_featured,
          is_active: prop.is_active,
          ranking_position: prop.ranking_position?.toString() || '',
        })
      }
    } catch (error) {
      console.error('Error fetching property:', error)
      navigate('/admin/propiedades')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const propertyData = {
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        description: formData.description || null,
        short_description: formData.short_description || null,
        address: formData.address,
        city: formData.city,
        province: formData.province,
        postal_code: formData.postal_code || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        google_rating: formData.google_rating ? parseFloat(formData.google_rating) : null,
        google_reviews_count: formData.google_reviews_count
          ? parseInt(formData.google_reviews_count)
          : null,
        booking_rating: formData.booking_rating ? parseFloat(formData.booking_rating) : null,
        booking_reviews_count: formData.booking_reviews_count
          ? parseInt(formData.booking_reviews_count)
          : null,
        airbnb_rating: formData.airbnb_rating ? parseFloat(formData.airbnb_rating) : null,
        airbnb_reviews_count: formData.airbnb_reviews_count
          ? parseInt(formData.airbnb_reviews_count)
          : null,
        property_type: formData.property_type,
        amenities: formData.amenities,
        cover_image: formData.cover_image || null,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
        ranking_position: formData.ranking_position
          ? parseInt(formData.ranking_position)
          : null,
      }

      // Calculate overall score
      const ratings = [
        propertyData.google_rating,
        propertyData.booking_rating,
        propertyData.airbnb_rating,
      ].filter(Boolean) as number[]
      const overall_score =
        ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null

      if (isEditing && id) {
        const { error } = await supabase
          .from('properties')
          .update({ ...propertyData, overall_score } as never)
          .eq('id', id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('properties')
          .insert({ ...propertyData, overall_score } as never)

        if (error) throw error
      }

      navigate('/admin/propiedades')
    } catch (error) {
      console.error('Error saving property:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/admin/propiedades"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-900 mb-4"
        >
          <ChevronLeft size={20} />
          Volver a propiedades
        </Link>
        <h1 className="font-display text-3xl font-bold text-primary-900">
          {isEditing ? 'Editar propiedad' : 'Nueva propiedad'}
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white border border-primary-200 p-6">
          <h2 className="font-display text-xl font-semibold text-primary-900 mb-6">
            Información básica
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleNameChange}
                required
                className="w-full px-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Slug (URL)
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="se-genera-automaticamente"
                className="w-full px-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Tipo de propiedad *
              </label>
              <select
                name="property_type"
                value={formData.property_type}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none bg-white"
              >
                {propertyTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Descripción corta
              </label>
              <input
                type="text"
                name="short_description"
                value={formData.short_description}
                onChange={handleChange}
                maxLength={160}
                className="w-full px-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Descripción completa
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white border border-primary-200 p-6">
          <h2 className="font-display text-xl font-semibold text-primary-900 mb-6 flex items-center gap-2">
            <MapPin size={20} />
            Ubicación
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Dirección *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Ciudad *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Provincia *
              </label>
              <select
                name="province"
                value={formData.province}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none bg-white"
              >
                {provinces.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Código postal
              </label>
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Latitud
                </label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  step="any"
                  className="w-full px-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Longitud
                </label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  step="any"
                  className="w-full px-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Ratings */}
        <div className="bg-white border border-primary-200 p-6">
          <h2 className="font-display text-xl font-semibold text-primary-900 mb-6 flex items-center gap-2">
            <Star size={20} />
            Valoraciones
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Google */}
            <div className="space-y-4">
              <h3 className="font-medium text-primary-800">Google Maps</h3>
              <div>
                <label className="block text-sm text-primary-600 mb-1">Puntuación</label>
                <input
                  type="number"
                  name="google_rating"
                  value={formData.google_rating}
                  onChange={handleChange}
                  min="0"
                  max="5"
                  step="0.1"
                  className="w-full px-4 py-2 border border-primary-200 focus:border-primary-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-primary-600 mb-1">Nº reseñas</label>
                <input
                  type="number"
                  name="google_reviews_count"
                  value={formData.google_reviews_count}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-primary-200 focus:border-primary-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Booking */}
            <div className="space-y-4">
              <h3 className="font-medium text-primary-800">Booking</h3>
              <div>
                <label className="block text-sm text-primary-600 mb-1">Puntuación</label>
                <input
                  type="number"
                  name="booking_rating"
                  value={formData.booking_rating}
                  onChange={handleChange}
                  min="0"
                  max="10"
                  step="0.1"
                  className="w-full px-4 py-2 border border-primary-200 focus:border-primary-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-primary-600 mb-1">Nº reseñas</label>
                <input
                  type="number"
                  name="booking_reviews_count"
                  value={formData.booking_reviews_count}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-primary-200 focus:border-primary-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Airbnb */}
            <div className="space-y-4">
              <h3 className="font-medium text-primary-800">Airbnb</h3>
              <div>
                <label className="block text-sm text-primary-600 mb-1">Puntuación</label>
                <input
                  type="number"
                  name="airbnb_rating"
                  value={formData.airbnb_rating}
                  onChange={handleChange}
                  min="0"
                  max="5"
                  step="0.1"
                  className="w-full px-4 py-2 border border-primary-200 focus:border-primary-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-primary-600 mb-1">Nº reseñas</label>
                <input
                  type="number"
                  name="airbnb_reviews_count"
                  value={formData.airbnb_reviews_count}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-primary-200 focus:border-primary-900 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Media & Settings */}
        <div className="bg-white border border-primary-200 p-6">
          <h2 className="font-display text-xl font-semibold text-primary-900 mb-6 flex items-center gap-2">
            <ImageIcon size={20} />
            Media y configuración
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                URL imagen de portada
              </label>
              <input
                type="url"
                name="cover_image"
                value={formData.cover_image}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none"
              />
              {formData.cover_image && (
                <div className="mt-3 w-40 h-28 bg-primary-100 overflow-hidden">
                  <img
                    src={formData.cover_image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Posición en ranking
              </label>
              <input
                type="number"
                name="ranking_position"
                value={formData.ranking_position}
                onChange={handleChange}
                min="1"
                className="w-full md:w-40 px-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-5 h-5 border-primary-300 text-primary-900 focus:ring-primary-900"
                />
                <span className="text-primary-800">Activo (visible en el ranking)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleChange}
                  className="w-5 h-5 border-primary-300 text-primary-900 focus:ring-primary-900"
                />
                <span className="text-primary-800">Destacado (aparece en la landing)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Link
            to="/admin/propiedades"
            className="px-6 py-3 text-primary-600 hover:text-primary-900"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary-900 text-white font-medium hover:bg-primary-800 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Save size={20} />
                {isEditing ? 'Guardar cambios' : 'Crear propiedad'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
