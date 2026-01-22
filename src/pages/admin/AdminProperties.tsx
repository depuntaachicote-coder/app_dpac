import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Star,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Property } from '../../types/database'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function AdminProperties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('ranking_position', { ascending: true })

      if (error) throw error
      setProperties(data || [])
    } catch (error) {
      console.error('Error fetching properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('properties').delete().eq('id', id)
      if (error) throw error
      setProperties(properties.filter((p) => p.id !== id))
      setDeleteId(null)
    } catch (error) {
      console.error('Error deleting property:', error)
    }
  }

  const filteredProperties = properties.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary-900">Propiedades</h1>
          <p className="mt-1 text-primary-600">Gestiona los hospedajes del ranking</p>
        </div>
        <Link
          to="/admin/propiedades/nueva"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-900 text-white font-medium hover:bg-primary-800 transition-colors"
        >
          <Plus size={20} />
          Nueva propiedad
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400"
        />
        <input
          type="text"
          placeholder="Buscar por nombre o ciudad..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none transition-colors bg-white"
        />
      </div>

      {/* Properties Table/Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredProperties.length > 0 ? (
        <div className="bg-white border border-primary-200 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary-50 border-b border-primary-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-primary-600">
                    #
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-primary-600">
                    Propiedad
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-primary-600">
                    Ubicación
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-primary-600">
                    Tipo
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-primary-600">
                    Valoración
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-primary-600">
                    Estado
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-primary-600">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-100">
                {filteredProperties.map((property) => (
                  <motion.tr
                    key={property.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-primary-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="w-8 h-8 bg-primary-900 text-white flex items-center justify-center text-sm font-bold">
                        {property.ranking_position || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-12 bg-primary-100 overflow-hidden">
                          {property.cover_image ? (
                            <img
                              src={property.cover_image}
                              alt={property.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary-400 text-xs">
                              Sin img
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-primary-900">{property.name}</p>
                          <p className="text-sm text-primary-500">{property.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-primary-600">
                        <MapPin size={14} />
                        <span>
                          {property.city}, {property.province}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 text-sm">
                        {property.property_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="fill-primary-900 text-primary-900" />
                        <span className="font-medium text-primary-900">
                          {property.overall_score?.toFixed(1) || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {property.is_active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-sm">
                          Activo
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-sm">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/hospedaje/${property.slug}`}
                          target="_blank"
                          className="p-2 text-primary-500 hover:text-primary-900 hover:bg-primary-100 transition-colors"
                        >
                          <Eye size={18} />
                        </Link>
                        <Link
                          to={`/admin/propiedades/${property.id}`}
                          className="p-2 text-primary-500 hover:text-primary-900 hover:bg-primary-100 transition-colors"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => setDeleteId(property.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-primary-200">
            {filteredProperties.map((property) => (
              <div key={property.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-16 bg-primary-100 flex-shrink-0">
                    {property.cover_image ? (
                      <img
                        src={property.cover_image}
                        alt={property.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary-400 text-xs">
                        Sin img
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-primary-900 truncate">
                          {property.name}
                        </p>
                        <p className="text-sm text-primary-500 flex items-center gap-1 mt-1">
                          <MapPin size={12} />
                          {property.city}
                        </p>
                      </div>
                      <span className="w-8 h-8 bg-primary-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {property.ranking_position || '-'}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      <Link
                        to={`/admin/propiedades/${property.id}`}
                        className="text-sm text-primary-600 hover:text-primary-900"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => setDeleteId(property.id)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-primary-200">
          <p className="text-primary-600">No se encontraron propiedades</p>
          <Link
            to="/admin/propiedades/nueva"
            className="inline-flex items-center gap-2 mt-4 text-primary-900 font-medium hover:underline"
          >
            <Plus size={18} />
            Añadir primera propiedad
          </Link>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 max-w-md mx-4 border border-primary-200"
          >
            <h3 className="font-display text-xl font-semibold text-primary-900">
              Eliminar propiedad
            </h3>
            <p className="mt-2 text-primary-600">
              ¿Estás seguro de que quieres eliminar esta propiedad? Esta acción no se
              puede deshacer.
            </p>
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-primary-600 hover:text-primary-900"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
