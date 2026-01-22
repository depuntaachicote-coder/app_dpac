import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Upload,
  Image as ImageIcon,
  Video,
  Trash2,
  Download,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Media, Property } from '../../types/database'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function AdminMedia() {
  const [media, setMedia] = useState<(Media & { property?: Property })[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<string>('')
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all')
  const [selectedMedia, setSelectedMedia] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchData()
  }, [selectedProperty, filterType])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch properties for filter
      const { data: propertiesData } = await supabase
        .from('properties')
        .select('*')
        .order('name')

      setProperties(propertiesData || [])

      // Fetch media
      let query = supabase.from('media').select('*, property:properties(*)')

      if (selectedProperty) {
        query = query.eq('property_id', selectedProperty)
      }

      if (filterType !== 'all') {
        query = query.eq('file_type', filterType)
      }

      const { data: mediaData, error } = await query.order('created_at', {
        ascending: false,
      })

      if (error) throw error
      setMedia(mediaData || [])
    } catch (error) {
      console.error('Error fetching media:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !selectedProperty) return

    setUploading(true)

    try {
      for (const file of Array.from(files)) {
        const fileType = file.type.startsWith('video/') ? 'video' : 'image'
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${selectedProperty}/${fileName}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Get public URL
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath)

        // Insert media record
        const { error: insertError } = await supabase.from('media').insert({
          property_id: selectedProperty,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: fileType as 'image' | 'video',
          file_size: file.size,
          mime_type: file.type,
        } as never)

        if (insertError) throw insertError
      }

      await fetchData()
    } catch (error) {
      console.error('Error uploading:', error)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (ids: string[]) => {
    try {
      const { error } = await supabase.from('media').delete().in('id', ids)
      if (error) throw error
      setMedia(media.filter((m) => !ids.includes(m.id)))
      setSelectedMedia([])
    } catch (error) {
      console.error('Error deleting media:', error)
    }
  }

  const toggleSelection = (id: string) => {
    setSelectedMedia((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary-900">Media</h1>
          <p className="mt-1 text-primary-600">Gestiona fotos y vídeos de las propiedades</p>
        </div>

        <div className="flex items-center gap-3">
          {selectedMedia.length > 0 && (
            <button
              onClick={() => handleDelete(selectedMedia)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700"
            >
              <Trash2 size={18} />
              Eliminar ({selectedMedia.length})
            </button>
          )}

          <label className="inline-flex items-center gap-2 px-6 py-3 bg-primary-900 text-white font-medium cursor-pointer hover:bg-primary-800 transition-colors">
            <Upload size={20} />
            Subir archivos
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleUpload}
              disabled={!selectedProperty || uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="w-full px-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none bg-white"
          >
            <option value="">Todas las propiedades</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex border border-primary-200 bg-white">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-primary-900 text-white'
                : 'text-primary-600 hover:bg-primary-50'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterType('image')}
            className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
              filterType === 'image'
                ? 'bg-primary-900 text-white'
                : 'text-primary-600 hover:bg-primary-50'
            }`}
          >
            <ImageIcon size={16} />
            Fotos
          </button>
          <button
            onClick={() => setFilterType('video')}
            className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
              filterType === 'video'
                ? 'bg-primary-900 text-white'
                : 'text-primary-600 hover:bg-primary-50'
            }`}
          >
            <Video size={16} />
            Vídeos
          </button>
        </div>
      </div>

      {!selectedProperty && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800">
          Selecciona una propiedad para subir nuevos archivos
        </div>
      )}

      {/* Media Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : uploading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-primary-600">Subiendo archivos...</p>
        </div>
      ) : media.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {media.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`relative aspect-square bg-primary-100 group cursor-pointer border-2 transition-colors ${
                selectedMedia.includes(item.id)
                  ? 'border-primary-900'
                  : 'border-transparent hover:border-primary-300'
              }`}
              onClick={() => toggleSelection(item.id)}
            >
              {item.file_type === 'image' ? (
                <img
                  src={item.file_url}
                  alt={item.file_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary-200">
                  <Video size={32} className="text-primary-500" />
                </div>
              )}

              {/* Selection indicator */}
              <div
                className={`absolute top-2 left-2 w-6 h-6 border-2 transition-colors flex items-center justify-center ${
                  selectedMedia.includes(item.id)
                    ? 'bg-primary-900 border-primary-900'
                    : 'bg-white/80 border-primary-300 opacity-0 group-hover:opacity-100'
                }`}
              >
                {selectedMedia.includes(item.id) && (
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>

              {/* Type badge */}
              <div className="absolute top-2 right-2">
                {item.file_type === 'video' ? (
                  <span className="px-2 py-1 bg-primary-900 text-white text-xs">
                    Vídeo
                  </span>
                ) : null}
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-primary-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <a
                  href={item.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 bg-white text-primary-900 hover:bg-primary-100"
                >
                  <Download size={18} />
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete([item.id])
                  }}
                  className="p-2 bg-white text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Property name */}
              {!selectedProperty && item.property && (
                <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-primary-900/80 text-white text-xs truncate">
                  {item.property.name}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-primary-200">
          <ImageIcon size={48} className="mx-auto text-primary-300 mb-4" />
          <p className="text-primary-600">No hay archivos multimedia</p>
          {selectedProperty && (
            <p className="text-sm text-primary-500 mt-2">
              Sube fotos o vídeos usando el botón de arriba
            </p>
          )}
        </div>
      )}
    </div>
  )
}
