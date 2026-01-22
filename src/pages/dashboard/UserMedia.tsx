import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import type { Media, Property } from '../../types/database'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function UserMedia() {
  const { profile } = useAuth()
  const [media, setMedia] = useState<Media[]>([])
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  useEffect(() => {
    if (profile?.id) {
      fetchMedia()
    }
  }, [profile?.id, filterType])

  const fetchMedia = async () => {
    if (!profile?.id) return

    try {
      setLoading(true)

      // Get user's property
      const { data: propertyData } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', profile.id)
        .single()

      setProperty(propertyData as Property | null)

      if (propertyData) {
        let query = supabase
          .from('media')
          .select('*')
          .eq('property_id', (propertyData as Property).id)
          .order('created_at', { ascending: false })

        if (filterType !== 'all') {
          query = query.eq('file_type', filterType)
        }

        const { data: mediaData, error } = await query

        if (error) throw error
        setMedia(mediaData || [])
      }
    } catch (error) {
      console.error('Error fetching media:', error)
    } finally {
      setLoading(false)
    }
  }

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
    } catch (error) {
      console.error('Error downloading file:', error)
    }
  }

  const downloadAll = async () => {
    for (const item of media) {
      await downloadFile(item.file_url, item.file_name)
    }
  }

  const images = media.filter((m) => m.file_type === 'image')
  const videos = media.filter((m) => m.file_type === 'video')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary-900">Media</h1>
          <p className="mt-1 text-primary-600">
            {property ? (
              <>
                Archivos de <strong>{property.name}</strong>
              </>
            ) : (
              'Tus fotos y vídeos'
            )}
          </p>
        </div>

        {media.length > 0 && (
          <button
            onClick={downloadAll}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-900 text-white font-medium hover:bg-primary-800"
          >
            <Download size={20} />
            Descargar todo
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-primary-200 p-4 text-center">
          <p className="text-3xl font-bold text-primary-900">{media.length}</p>
          <p className="text-sm text-primary-500">Total archivos</p>
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex border border-primary-200 bg-white">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-primary-900 text-white'
                : 'text-primary-600 hover:bg-primary-50'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterType('image')}
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
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
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
              filterType === 'video'
                ? 'bg-primary-900 text-white'
                : 'text-primary-600 hover:bg-primary-50'
            }`}
          >
            <Video size={16} />
            Vídeos
          </button>
        </div>

        <div className="flex border border-primary-200 bg-white">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary-900 text-white'
                : 'text-primary-600 hover:bg-primary-50'
            }`}
          >
            <Grid size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-900 text-white'
                : 'text-primary-600 hover:bg-primary-50'
            }`}
          >
            <List size={20} />
          </button>
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
          <p className="text-primary-600">
            Aún no tienes una propiedad asignada.
          </p>
          <p className="text-sm text-primary-500 mt-2">
            Una vez contratados nuestros servicios, aquí podrás acceder a tu contenido.
          </p>
        </div>
      ) : media.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {media.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                className="aspect-square bg-primary-100 relative group cursor-pointer"
                onClick={() => setSelectedIndex(index)}
              >
                {item.file_type === 'image' ? (
                  <img
                    src={item.file_url}
                    alt={item.file_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary-200">
                    <Play size={32} className="text-primary-500" />
                  </div>
                )}

                {item.file_type === 'video' && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-primary-900 text-white text-xs">
                    Vídeo
                  </div>
                )}

                <div className="absolute inset-0 bg-primary-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      downloadFile(item.file_url, item.file_name)
                    }}
                    className="p-3 bg-white text-primary-900 hover:bg-primary-100"
                  >
                    <Download size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-primary-200 divide-y divide-primary-100">
            {media.map((item) => (
              <div
                key={item.id}
                className="p-4 flex items-center gap-4 hover:bg-primary-50 transition-colors"
              >
                <div className="w-16 h-16 bg-primary-100 flex-shrink-0 overflow-hidden">
                  {item.file_type === 'image' ? (
                    <img
                      src={item.file_url}
                      alt={item.file_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary-200">
                      <Video size={24} className="text-primary-500" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-primary-900 truncate">{item.file_name}</p>
                  <p className="text-sm text-primary-500">
                    {item.file_type === 'image' ? 'Foto' : 'Vídeo'} ·{' '}
                    {item.file_size
                      ? `${(item.file_size / 1024 / 1024).toFixed(2)} MB`
                      : 'Tamaño desconocido'}
                  </p>
                </div>

                <button
                  onClick={() => downloadFile(item.file_url, item.file_name)}
                  className="p-2 text-primary-600 hover:text-primary-900 hover:bg-primary-100"
                >
                  <Download size={20} />
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-20 bg-white border border-primary-200">
          <ImageIcon size={48} className="mx-auto text-primary-300 mb-4" />
          <p className="text-primary-600">No hay archivos disponibles</p>
        </div>
      )}

      {/* Lightbox */}
      {selectedIndex !== null && media.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-primary-900/95 flex items-center justify-center"
          onClick={() => setSelectedIndex(null)}
        >
          <button
            onClick={() => setSelectedIndex(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full"
          >
            <X size={32} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedIndex(
                selectedIndex > 0 ? selectedIndex - 1 : media.length - 1
              )
            }}
            className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-full"
          >
            <ChevronLeft size={32} />
          </button>

          {media[selectedIndex].file_type === 'image' ? (
            <img
              src={media[selectedIndex].file_url}
              alt={media[selectedIndex].file_name}
              className="max-w-[90vw] max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <video
              src={media[selectedIndex].file_url}
              controls
              className="max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            />
          )}

          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedIndex(
                selectedIndex < media.length - 1 ? selectedIndex + 1 : 0
              )
            }}
            className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-full"
          >
            <ChevronRight size={32} />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
            <span className="text-white">
              {selectedIndex + 1} / {media.length}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                downloadFile(
                  media[selectedIndex].file_url,
                  media[selectedIndex].file_name
                )
              }}
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
