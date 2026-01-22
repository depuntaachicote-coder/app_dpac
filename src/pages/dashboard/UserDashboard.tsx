import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Image, FileText, Receipt, Download, Calendar, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import type { Property, Media } from '../../types/database'

export default function UserDashboard() {
  const { profile } = useAuth()
  const [property, setProperty] = useState<Property | null>(null)
  const [stats, setStats] = useState({
    totalMedia: 0,
    totalBudgets: 0,
    totalInvoices: 0,
  })
  const [recentMedia, setRecentMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.id) {
      fetchUserData()
    }
  }, [profile?.id])

  const fetchUserData = async () => {
    if (!profile?.id) return

    try {
      setLoading(true)

      // Fetch user's property
      const { data: propertyData } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', profile.id)
        .single()

      setProperty(propertyData as Property | null)

      if (propertyData) {
        // Fetch stats
        const [mediaRes, budgetsRes, invoicesRes] = await Promise.all([
          supabase
            .from('media')
            .select('*', { count: 'exact' })
            .eq('property_id', (propertyData as Property).id),
          supabase
            .from('budgets')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', profile.id),
          supabase
            .from('invoices')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', profile.id),
        ])

        setStats({
          totalMedia: mediaRes.count || 0,
          totalBudgets: budgetsRes.count || 0,
          totalInvoices: invoicesRes.count || 0,
        })

        setRecentMedia((mediaRes.data || []).slice(0, 6))
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickLinks = [
    {
      icon: Image,
      label: 'Ver media',
      description: 'Accede a tus fotos y vídeos',
      href: '/dashboard/media',
      count: stats.totalMedia,
    },
    {
      icon: FileText,
      label: 'Presupuestos',
      description: 'Revisa tus presupuestos',
      href: '/dashboard/presupuestos',
      count: stats.totalBudgets,
    },
    {
      icon: Receipt,
      label: 'Facturas',
      description: 'Gestiona tu facturación',
      href: '/dashboard/facturas',
      count: stats.totalInvoices,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-white border border-primary-200 p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-primary-900">
            Bienvenido, {profile?.full_name?.split(' ')[0] || 'Usuario'}
          </h1>
          <p className="mt-2 text-primary-600">
            {property ? (
              <>
                Gestiona el contenido de <strong>{property.name}</strong>
              </>
            ) : (
              'Tu área de cliente de De Punta a Chicote'
            )}
          </p>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        {quickLinks.map((link, index) => (
          <motion.div
            key={link.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={link.href}
              className="block bg-white border border-primary-200 p-6 hover:border-primary-900 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 bg-primary-100 flex items-center justify-center group-hover:bg-primary-900 transition-colors">
                  <link.icon
                    size={24}
                    className="text-primary-600 group-hover:text-white transition-colors"
                  />
                </div>
                <span className="text-2xl font-bold text-primary-900">
                  {link.count}
                </span>
              </div>
              <h3 className="mt-4 font-medium text-primary-900">{link.label}</h3>
              <p className="mt-1 text-sm text-primary-500">{link.description}</p>
              <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary-900 group-hover:gap-4 transition-all">
                Ver más
                <ArrowRight size={16} />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Recent Media Preview */}
      {recentMedia.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-primary-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-semibold text-primary-900">
              Media reciente
            </h2>
            <Link
              to="/dashboard/media"
              className="text-sm font-medium text-primary-600 hover:text-primary-900 flex items-center gap-2"
            >
              Ver todo
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {recentMedia.map((item) => (
              <div
                key={item.id}
                className="aspect-square bg-primary-100 relative overflow-hidden group"
              >
                {item.file_type === 'image' ? (
                  <img
                    src={item.file_url}
                    alt={item.file_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image size={24} className="text-primary-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-primary-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <a
                    href={item.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white text-primary-900"
                  >
                    <Download size={18} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* No Property Message */}
      {!loading && !property && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-primary-50 border border-primary-200 p-8 text-center"
        >
          <Calendar size={48} className="mx-auto text-primary-400 mb-4" />
          <h3 className="font-display text-xl font-semibold text-primary-900">
            Aún no tienes una propiedad asignada
          </h3>
          <p className="mt-2 text-primary-600 max-w-md mx-auto">
            Una vez que contrates nuestros servicios, aquí podrás acceder a todo el
            material multimedia de tu hospedaje.
          </p>
        </motion.div>
      )}

      {/* Info Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-primary-200 p-6"
        >
          <h3 className="font-display text-lg font-semibold text-primary-900 mb-4">
            ¿Necesitas ayuda?
          </h3>
          <p className="text-primary-600 mb-4">
            Nuestro equipo está disponible para resolver cualquier duda sobre tu cuenta
            o los servicios contratados.
          </p>
          <a
            href="mailto:info@depuntaachicote.com"
            className="inline-flex items-center gap-2 text-primary-900 font-medium hover:gap-4 transition-all"
          >
            Contactar soporte
            <ArrowRight size={16} />
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-primary-900 text-white p-6"
        >
          <h3 className="font-display text-lg font-semibold mb-4">
            Potencia tu visibilidad
          </h3>
          <p className="text-primary-300 mb-4">
            Descubre cómo podemos ayudarte a destacar tu hospedaje con nuestros paquetes
            de marketing y contenido audiovisual.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white font-medium hover:gap-4 transition-all"
          >
            Ver servicios
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
