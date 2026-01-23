import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Building,
  Users,
  Image,
  Share2,
  Mail,
  LogOut,
  Menu,
  X,
  ChevronLeft,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/ui/Logo'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Building, label: 'Propiedades', path: '/admin/propiedades' },
  { icon: Users, label: 'Usuarios', path: '/admin/usuarios' },
  { icon: Image, label: 'Media', path: '/admin/media' },
  { icon: Share2, label: 'Redes Sociales', path: '/admin/social' },
  { icon: Mail, label: 'Email Marketing', path: '/admin/email-marketing' },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { signOut, profile } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      // Force navigation after signOut completes
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Error signing out:', error)
      // Force navigation even on error
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-primary-900 z-40 flex items-center justify-between px-4">
        <Logo size="sm" variant="light" />
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-white hover:bg-primary-800 rounded-lg transition-colors"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : '-100%',
        }}
        className="fixed top-0 left-0 h-full w-64 bg-primary-900 z-50 lg:translate-x-0 lg:z-30"
        style={{ transform: 'translateX(-100%)' }}
      >
        <style>{`
          @media (min-width: 1024px) {
            aside { transform: translateX(0) !important; }
          }
        `}</style>
        <div className="p-6 border-b border-primary-800">
          <Logo variant="light" />
          <span className="text-xs text-primary-400 mt-1 block">Panel de Administración</span>
        </div>

        <div className="p-4">
          <div className="mb-6 p-4 bg-primary-800 rounded-lg">
            <p className="text-sm text-primary-400">Administrador</p>
            <p className="font-medium text-white truncate">
              {profile?.full_name || profile?.email}
            </p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-primary-900'
                      : 'text-primary-300 hover:bg-primary-800 hover:text-white'
                  }`
                }
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-800">
          <NavLink
            to="/"
            className="flex items-center gap-3 px-4 py-3 w-full text-primary-300 hover:bg-primary-800 hover:text-white rounded-lg transition-colors mb-2"
          >
            <ChevronLeft size={20} />
            <span>Volver al sitio</span>
          </NavLink>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 w-full text-primary-300 hover:bg-primary-800 hover:text-white rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </motion.aside>

      {/* Overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  )
}
