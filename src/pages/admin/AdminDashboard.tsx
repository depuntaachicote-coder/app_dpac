import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Building,
  Users,
  Image,
  Share2,
  TrendingUp,
  Plus,
  ArrowRight,
  Calendar,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Stats {
  totalProperties: number
  totalUsers: number
  totalMedia: number
  scheduledPosts: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProperties: 0,
    totalUsers: 0,
    totalMedia: 0,
    scheduledPosts: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [propertiesRes, usersRes, mediaRes, postsRes] = await Promise.all([
          supabase.from('properties').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user'),
          supabase.from('media').select('id', { count: 'exact', head: true }),
          supabase.from('social_posts').select('id', { count: 'exact', head: true }).eq('status', 'scheduled'),
        ])

        setStats({
          totalProperties: propertiesRes.count || 0,
          totalUsers: usersRes.count || 0,
          totalMedia: mediaRes.count || 0,
          scheduledPosts: postsRes.count || 0,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      label: 'Propiedades',
      value: stats.totalProperties,
      icon: Building,
      href: '/admin/propiedades',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Usuarios',
      value: stats.totalUsers,
      icon: Users,
      href: '/admin/usuarios',
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Archivos Media',
      value: stats.totalMedia,
      icon: Image,
      href: '/admin/media',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Posts Programados',
      value: stats.scheduledPosts,
      icon: Share2,
      href: '/admin/social',
      color: 'bg-orange-50 text-orange-600',
    },
  ]

  const quickActions = [
    {
      label: 'Nueva propiedad',
      icon: Plus,
      href: '/admin/propiedades/nueva',
    },
    {
      label: 'Subir media',
      icon: Image,
      href: '/admin/media',
    },
    {
      label: 'Programar post',
      icon: Calendar,
      href: '/admin/social',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-primary-900">
          Panel de Administración
        </h1>
        <p className="mt-2 text-primary-600">
          Gestiona propiedades, usuarios y contenido de De Punta a Chicote
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={stat.href}
              className="block p-6 bg-white border border-primary-200 hover:border-primary-900 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} flex items-center justify-center`}>
                  <stat.icon size={24} />
                </div>
                <TrendingUp size={20} className="text-primary-400" />
              </div>
              <p className="text-3xl font-bold text-primary-900">
                {loading ? '...' : stat.value}
              </p>
              <p className="text-primary-600 mt-1">{stat.label}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-primary-200 p-6"
        >
          <h2 className="font-display text-xl font-semibold text-primary-900 mb-6">
            Acciones rápidas
          </h2>
          <div className="space-y-3">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.href}
                className="flex items-center justify-between p-4 border border-primary-200 hover:border-primary-900 hover:bg-primary-50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary-100 flex items-center justify-center group-hover:bg-primary-900 transition-colors">
                    <action.icon
                      size={20}
                      className="text-primary-600 group-hover:text-white transition-colors"
                    />
                  </div>
                  <span className="font-medium text-primary-900">{action.label}</span>
                </div>
                <ArrowRight
                  size={20}
                  className="text-primary-400 group-hover:text-primary-900 group-hover:translate-x-1 transition-all"
                />
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white border border-primary-200 p-6"
        >
          <h2 className="font-display text-xl font-semibold text-primary-900 mb-6">
            Actividad reciente
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-primary-50">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <div>
                <p className="text-sm font-medium text-primary-900">Sistema iniciado</p>
                <p className="text-xs text-primary-500">Panel de administración activo</p>
              </div>
            </div>
            <p className="text-sm text-primary-500 text-center py-8">
              La actividad reciente aparecerá aquí
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
