import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, MapPin, ChevronDown } from 'lucide-react'
import PropertyCard from '../components/property/PropertyCard'
import { useProperties } from '../hooks/useProperties'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const provinces = [
  'Todas',
  'A Coruña',
  'Lugo',
  'Ourense',
  'Pontevedra',
]

const propertyTypes = [
  'Todos',
  'Hotel',
  'Casa Rural',
  'Apartamento',
  'Hostal',
  'Pazo',
]

export default function Ranking() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProvince, setSelectedProvince] = useState('Todas')
  const [selectedType, setSelectedType] = useState('Todos')
  const [showFilters, setShowFilters] = useState(false)

  const { properties, loading } = useProperties({
    province: selectedProvince !== 'Todas' ? selectedProvince : undefined,
  })

  // Filter properties based on search and type
  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.city.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType =
      selectedType === 'Todos' || property.property_type === selectedType
    return matchesSearch && matchesType
  })

  return (
    <div className="min-h-screen pt-20 bg-white">
      {/* Header */}
      <section className="py-16 sm:py-24 border-b border-primary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <span className="text-sm font-medium tracking-wider text-primary-500">
              LOS MEJORES DE GALICIA
            </span>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-900">
              Ranking de Hospedajes
            </h1>
            <p className="mt-4 text-primary-600 max-w-2xl mx-auto">
              Descubre los hospedajes turísticos mejor valorados de Galicia,
              seleccionados y verificados por nuestro equipo.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 border-b border-primary-200 sticky top-20 bg-white z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400"
              />
              <input
                type="text"
                placeholder="Buscar por nombre o ciudad..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none transition-colors"
              />
            </div>

            {/* Filter Toggle (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center justify-center gap-2 py-3 border border-primary-200 text-primary-600"
            >
              <Filter size={18} />
              Filtros
              <ChevronDown
                size={18}
                className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Desktop Filters */}
            <div className="hidden lg:flex items-center gap-4">
              {/* Province Select */}
              <div className="relative">
                <MapPin
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400"
                />
                <select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  className="pl-12 pr-10 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none appearance-none bg-white cursor-pointer"
                >
                  {provinces.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-400 pointer-events-none"
                />
              </div>

              {/* Type Select */}
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="pl-4 pr-10 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none appearance-none bg-white cursor-pointer"
                >
                  {propertyTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-400 pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden mt-4 pt-4 border-t border-primary-200 flex flex-col gap-4"
            >
              <div className="relative">
                <MapPin
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400"
                />
                <select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none appearance-none bg-white"
                >
                  {provinces.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-400 pointer-events-none"
                />
              </div>

              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none appearance-none bg-white"
                >
                  {propertyTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-400 pointer-events-none"
                />
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Results count */}
          <div className="mb-8 flex items-center justify-between">
            <p className="text-primary-600">
              {loading ? (
                'Cargando...'
              ) : (
                <>
                  <span className="font-medium text-primary-900">
                    {filteredProperties.length}
                  </span>{' '}
                  hospedajes encontrados
                </>
              )}
            </p>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProperties.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <PropertyCard
                    property={property}
                    rank={property.ranking_position || index + 1}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-primary-600 text-lg">
                No se encontraron hospedajes con los filtros seleccionados.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedProvince('Todas')
                  setSelectedType('Todos')
                }}
                className="mt-4 text-primary-900 underline underline-offset-4"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
