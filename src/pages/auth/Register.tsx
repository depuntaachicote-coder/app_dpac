import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, User, Building, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Logo from '../../components/ui/Logo'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)

    try {
      const { error } = await signUp(
        formData.email,
        formData.password,
        formData.fullName,
        formData.companyName
      )

      if (error) {
        setError('Error al crear la cuenta. El email puede ya estar registrado.')
      } else {
        setSuccess(true)
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      }
    } catch {
      setError('Ha ocurrido un error. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-white px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h1 className="font-display text-3xl font-bold text-primary-900">
            ¡Cuenta creada!
          </h1>
          <p className="mt-4 text-primary-600">
            Te hemos enviado un email de confirmación. Por favor, verifica tu cuenta
            antes de iniciar sesión.
          </p>
          <p className="mt-6 text-sm text-primary-500">
            Redirigiendo al login...
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center bg-white px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <Logo size="lg" showTagline />
          </div>
          <h1 className="font-display text-3xl font-bold text-primary-900">
            Crear cuenta
          </h1>
          <p className="mt-2 text-primary-600">
            Únete y potencia tu hospedaje
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700"
            >
              <AlertCircle size={20} />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-primary-700 mb-2">
              Nombre completo *
            </label>
            <div className="relative">
              <User
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400"
              />
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="Tu nombre"
                className="w-full pl-12 pr-4 py-4 border border-primary-200 focus:border-primary-900 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Company Name */}
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-primary-700 mb-2">
              Nombre del hospedaje
            </label>
            <div className="relative">
              <Building
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400"
              />
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Hotel, Casa Rural, etc."
                className="w-full pl-12 pr-4 py-4 border border-primary-200 focus:border-primary-900 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-primary-700 mb-2">
              Email *
            </label>
            <div className="relative">
              <Mail
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400"
              />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="tu@email.com"
                className="w-full pl-12 pr-4 py-4 border border-primary-200 focus:border-primary-900 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-primary-700 mb-2">
              Contraseña *
            </label>
            <div className="relative">
              <Lock
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-12 pr-12 py-4 border border-primary-200 focus:border-primary-900 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary-700 mb-2">
              Confirmar contraseña *
            </label>
            <div className="relative">
              <Lock
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Repite la contraseña"
                className="w-full pl-12 pr-4 py-4 border border-primary-200 focus:border-primary-900 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Terms */}
          <p className="text-xs text-primary-500">
            Al registrarte, aceptas nuestros{' '}
            <a href="#" className="underline hover:text-primary-900">
              Términos y Condiciones
            </a>{' '}
            y{' '}
            <a href="#" className="underline hover:text-primary-900">
              Política de Privacidad
            </a>
            .
          </p>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary-900 text-white font-medium border border-primary-900 hover:bg-white hover:text-primary-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Crear cuenta'}
          </button>

          {/* Login Link */}
          <p className="text-center text-primary-600">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary-900 font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
        </form>

        {/* Decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-12 h-px bg-primary-200 origin-center"
        />
      </motion.div>
    </div>
  )
}
