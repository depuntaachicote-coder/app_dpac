import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Logo from '../ui/Logo'

const navLinks = [
  { label: 'Inicio', path: '/' },
  { label: 'Ranking', path: '/ranking' },
]

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, profile, loading, isAdmin } = useAuth()
  const location = useLocation()

  // Only show authenticated state when fully loaded and profile exists
  const isAuthenticated = !loading && user && profile

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsOpen(false)
  }, [location])

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Logo />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `relative py-2 text-sm font-medium tracking-wide transition-colors ${
                    isActive ? 'text-primary-900' : 'text-primary-600 hover:text-primary-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute -bottom-1 left-0 right-0 h-px bg-primary-900"
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {loading ? (
              <div className="w-24 h-10 bg-primary-100 animate-pulse" />
            ) : isAuthenticated ? (
              <Link
                to={isAdmin ? '/admin' : '/dashboard'}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary-900 text-white text-sm font-medium rounded-none border border-primary-900 hover:bg-white hover:text-primary-900 transition-all duration-300"
              >
                <User size={18} />
                {isAdmin ? 'Admin' : 'Mi cuenta'}
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-6 py-2.5 text-sm font-medium text-primary-900 hover:text-primary-600 transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/registro"
                  className="px-6 py-2.5 bg-primary-900 text-white text-sm font-medium border border-primary-900 hover:bg-white hover:text-primary-900 transition-all duration-300"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-primary-900 hover:bg-primary-100 rounded-lg transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white border-t border-primary-200"
          >
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `block py-3 text-lg font-medium border-b border-primary-100 ${
                      isActive ? 'text-primary-900' : 'text-primary-600'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="pt-4 space-y-3">
                {loading ? (
                  <div className="w-full h-12 bg-primary-100 animate-pulse" />
                ) : isAuthenticated ? (
                  <Link
                    to={isAdmin ? '/admin' : '/dashboard'}
                    className="block w-full py-3 text-center bg-primary-900 text-white font-medium"
                  >
                    {isAdmin ? 'Panel Admin' : 'Mi cuenta'}
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="block w-full py-3 text-center border border-primary-900 text-primary-900 font-medium"
                    >
                      Iniciar sesión
                    </Link>
                    <Link
                      to="/registro"
                      className="block w-full py-3 text-center bg-primary-900 text-white font-medium"
                    >
                      Registrarse
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
