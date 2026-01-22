import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Instagram,
  Youtube,
  Facebook,
  Calendar,
  Clock,
  Plus,
  Send,
  Trash2,
  Edit,
  X,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { SocialPost, Property } from '../../types/database'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
  </svg>
)

const platformIcons = {
  instagram: Instagram,
  facebook: Facebook,
  tiktok: TikTokIcon,
  youtube: Youtube,
}

const platformColors = {
  instagram: 'bg-pink-100 text-pink-700',
  facebook: 'bg-blue-100 text-blue-700',
  tiktok: 'bg-gray-100 text-gray-700',
  youtube: 'bg-red-100 text-red-700',
}

type Platform = 'instagram' | 'facebook' | 'tiktok' | 'youtube'

export default function AdminSocial() {
  const [posts, setPosts] = useState<(SocialPost & { property?: Property })[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null)

  const [formData, setFormData] = useState({
    property_id: '',
    platform: 'instagram' as Platform,
    content: '',
    hashtags: '',
    scheduled_at: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      const [postsRes, propertiesRes] = await Promise.all([
        supabase
          .from('social_posts')
          .select('*, property:properties(*)')
          .order('scheduled_at', { ascending: true }),
        supabase.from('properties').select('*').order('name'),
      ])

      setPosts(postsRes.data || [])
      setProperties(propertiesRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const postData = {
        property_id: formData.property_id,
        platform: formData.platform,
        content: formData.content,
        hashtags: formData.hashtags.split(',').map((h) => h.trim()).filter(Boolean),
        scheduled_at: formData.scheduled_at || null,
        status: formData.scheduled_at ? 'scheduled' : 'draft',
      }

      if (editingPost) {
        const { error } = await supabase
          .from('social_posts')
          .update(postData as never)
          .eq('id', editingPost.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('social_posts').insert(postData as never)
        if (error) throw error
      }

      setShowModal(false)
      setEditingPost(null)
      resetForm()
      await fetchData()
    } catch (error) {
      console.error('Error saving post:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('social_posts').delete().eq('id', id)
      if (error) throw error
      setPosts(posts.filter((p) => p.id !== id))
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  const handlePublish = async (id: string) => {
    try {
      // En producción, aquí se conectaría con las APIs de las RRSS
      const { error } = await supabase
        .from('social_posts')
        .update({ status: 'published', published_at: new Date().toISOString() } as never)
        .eq('id', id)

      if (error) throw error
      await fetchData()
    } catch (error) {
      console.error('Error publishing post:', error)
    }
  }

  const openEditModal = (post: SocialPost) => {
    setEditingPost(post)
    setFormData({
      property_id: post.property_id,
      platform: post.platform,
      content: post.content || '',
      hashtags: post.hashtags?.join(', ') || '',
      scheduled_at: post.scheduled_at
        ? new Date(post.scheduled_at).toISOString().slice(0, 16)
        : '',
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      property_id: '',
      platform: 'instagram',
      content: '',
      hashtags: '',
      scheduled_at: '',
    })
  }

  const scheduledPosts = posts.filter((p) => p.status === 'scheduled')
  const draftPosts = posts.filter((p) => p.status === 'draft')
  const publishedPosts = posts.filter((p) => p.status === 'published')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary-900">Redes Sociales</h1>
          <p className="mt-1 text-primary-600">Gestiona y programa publicaciones</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setEditingPost(null)
            setShowModal(true)
          }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-900 text-white font-medium hover:bg-primary-800"
        >
          <Plus size={20} />
          Nueva publicación
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(['instagram', 'facebook', 'tiktok', 'youtube'] as Platform[]).map((platform) => {
          const count = posts.filter((p) => p.platform === platform).length
          const Icon = platformIcons[platform]
          return (
            <div
              key={platform}
              className="bg-white border border-primary-200 p-4 flex items-center gap-4"
            >
              <div className={`w-12 h-12 ${platformColors[platform]} flex items-center justify-center`}>
                {platform === 'tiktok' ? (
                  <TikTokIcon className="w-6 h-6" />
                ) : (
                  <Icon size={24} />
                )}
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-900">{count}</p>
                <p className="text-sm text-primary-500 capitalize">{platform}</p>
              </div>
            </div>
          )
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Scheduled */}
          <section>
            <h2 className="font-display text-xl font-semibold text-primary-900 mb-4 flex items-center gap-2">
              <Calendar size={20} />
              Programadas ({scheduledPosts.length})
            </h2>
            {scheduledPosts.length > 0 ? (
              <div className="grid gap-4">
                {scheduledPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onEdit={() => openEditModal(post)}
                    onDelete={() => handleDelete(post.id)}
                    onPublish={() => handlePublish(post.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-primary-500 py-4">No hay publicaciones programadas</p>
            )}
          </section>

          {/* Drafts */}
          <section>
            <h2 className="font-display text-xl font-semibold text-primary-900 mb-4 flex items-center gap-2">
              <Edit size={20} />
              Borradores ({draftPosts.length})
            </h2>
            {draftPosts.length > 0 ? (
              <div className="grid gap-4">
                {draftPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onEdit={() => openEditModal(post)}
                    onDelete={() => handleDelete(post.id)}
                    onPublish={() => handlePublish(post.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-primary-500 py-4">No hay borradores</p>
            )}
          </section>

          {/* Published */}
          <section>
            <h2 className="font-display text-xl font-semibold text-primary-900 mb-4 flex items-center gap-2">
              <Send size={20} />
              Publicadas ({publishedPosts.length})
            </h2>
            {publishedPosts.length > 0 ? (
              <div className="grid gap-4">
                {publishedPosts.slice(0, 5).map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onEdit={() => openEditModal(post)}
                    onDelete={() => handleDelete(post.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-primary-500 py-4">No hay publicaciones</p>
            )}
          </section>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-primary-200 flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-primary-900">
                {editingPost ? 'Editar publicación' : 'Nueva publicación'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-primary-400 hover:text-primary-900"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Propiedad *
                </label>
                <select
                  value={formData.property_id}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, property_id: e.target.value }))
                  }
                  required
                  className="w-full px-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none bg-white"
                >
                  <option value="">Seleccionar propiedad</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Plataforma *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['instagram', 'facebook', 'tiktok', 'youtube'] as Platform[]).map(
                    (platform) => {
                      const Icon = platformIcons[platform]
                      return (
                        <button
                          key={platform}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, platform }))
                          }
                          className={`p-3 border-2 transition-colors flex flex-col items-center gap-1 ${
                            formData.platform === platform
                              ? 'border-primary-900 bg-primary-50'
                              : 'border-primary-200 hover:border-primary-300'
                          }`}
                        >
                          {platform === 'tiktok' ? (
                            <TikTokIcon className="w-6 h-6" />
                          ) : (
                            <Icon size={24} />
                          )}
                          <span className="text-xs capitalize">{platform}</span>
                        </button>
                      )
                    }
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Contenido
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, content: e.target.value }))
                  }
                  rows={4}
                  placeholder="Texto de la publicación..."
                  className="w-full px-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Hashtags
                </label>
                <input
                  type="text"
                  value={formData.hashtags}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, hashtags: e.target.value }))
                  }
                  placeholder="#galicia, #turismo, #hospedaje"
                  className="w-full px-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none"
                />
                <p className="text-xs text-primary-500 mt-1">
                  Separados por comas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Programar para
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, scheduled_at: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none"
                />
                <p className="text-xs text-primary-500 mt-1">
                  Deja vacío para guardar como borrador
                </p>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-primary-600 hover:text-primary-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-900 text-white hover:bg-primary-800"
                >
                  {editingPost ? 'Guardar cambios' : 'Crear publicación'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

interface PostCardProps {
  post: SocialPost & { property?: Property }
  onEdit: () => void
  onDelete: () => void
  onPublish?: () => void
}

function PostCard({ post, onEdit, onDelete, onPublish }: PostCardProps) {
  const Icon = platformIcons[post.platform]

  return (
    <div className="bg-white border border-primary-200 p-4 flex items-start gap-4">
      <div className={`w-10 h-10 ${platformColors[post.platform]} flex items-center justify-center flex-shrink-0`}>
        {post.platform === 'tiktok' ? (
          <TikTokIcon className="w-5 h-5" />
        ) : (
          <Icon size={20} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-primary-900">
              {post.property?.name || 'Propiedad eliminada'}
            </p>
            <p className="text-sm text-primary-600 line-clamp-2 mt-1">
              {post.content || 'Sin contenido'}
            </p>
            {post.hashtags && post.hashtags.length > 0 && (
              <p className="text-sm text-blue-600 mt-1">
                {post.hashtags.map((h) => `#${h}`).join(' ')}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {post.status !== 'published' && onPublish && (
              <button
                onClick={onPublish}
                className="p-2 text-green-600 hover:bg-green-50"
                title="Publicar ahora"
              >
                <Send size={18} />
              </button>
            )}
            <button
              onClick={onEdit}
              className="p-2 text-primary-500 hover:bg-primary-50"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-red-500 hover:bg-red-50"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-4 text-sm text-primary-500">
          <span
            className={`px-2 py-0.5 text-xs font-medium ${
              post.status === 'published'
                ? 'bg-green-100 text-green-700'
                : post.status === 'scheduled'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {post.status === 'published'
              ? 'Publicada'
              : post.status === 'scheduled'
              ? 'Programada'
              : 'Borrador'}
          </span>

          {post.scheduled_at && (
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {new Date(post.scheduled_at).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
