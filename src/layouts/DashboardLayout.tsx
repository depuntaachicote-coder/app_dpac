import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Image,
  FileText,
  Receipt,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/ui/Logo'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Image, label: 'Media', path: '/dashboard/media' },
  { icon: FileText, label: 'Presupuestos', path: '/dashboard/presupuestos' },
  { icon: Receipt, label: 'Facturas', path: '/dashboard/facturas' },
  { icon: User, label: 'Perfil', path: '/dashboard/perfil' },
]

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { signOut, profile } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-primary-200 z-40 flex items-center justify-between px-4">
        <Logo size="sm" />
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
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
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-primary-200 z-50 lg:translate-x-0 lg:z-30`}
        style={{ transform: 'translateX(-100%)' }}
      >
        <div className="lg:block hidden">
          <style>{`
            @media (min-width: 1024px) {
              aside { transform: translateX(0) !important; }
            }
          `}</style>
        </div>
        <div className="p-6 border-b border-primary-200">
          <Logo />
        </div>

        <div className="p-4">
          <div className="mb-6 p-4 bg-primary-50 rounded-lg">
            <p className="text-sm text-primary-500">Bienvenido</p>
            <p className="font-medium text-primary-900 truncate">
              {profile?.full_name || profile?.email}
            </p>
            {profile?.company_name && (
              <p className="text-sm text-primary-600 truncate">{profile.company_name}</p>
            )}
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-900 text-white'
                      : 'text-primary-600 hover:bg-primary-100 hover:text-primary-900'
                  }`
                }
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-200">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 w-full text-primary-600 hover:bg-primary-100 hover:text-primary-900 rounded-lg transition-colors"
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
