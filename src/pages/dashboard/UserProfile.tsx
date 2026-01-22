import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Building, MapPin, Save, AlertCircle, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function UserProfile() {
  const { profile } = useAuth()
  const [formData, setFormData] = useState({
    full_name: '',
    company_name: '',
    email: '',
    phone: '',
    address: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        company_name: profile.company_name || '',
        email: profile.email,
        phone: profile.phone || '',
        address: profile.address || '',
      })
    }
  }, [profile])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
    setSuccess(false)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.id) return

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          company_name: formData.company_name,
          phone: formData.phone,
          address: formData.address,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', profile.id)

      if (updateError) throw updateError
      setSuccess(true)
    } catch {
      setError('Error al guardar los cambios. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-primary-900">Mi perfil</h1>
        <p className="mt-1 text-primary-600">Gestiona tu información personal</p>
      </div>

      {/* Profile Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-white border border-primary-200 p-6 lg:p-8 space-y-6"
      >
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 text-green-700"
          >
            <Check size={20} />
            <span>Perfil actualizado correctamente</span>
          </motion.div>
        )}

        {/* Avatar Placeholder */}
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
            <User size={32} className="text-primary-400" />
          </div>
          <div>
            <p className="font-medium text-primary-900">
              {formData.full_name || 'Usuario'}
            </p>
            <p className="text-sm text-primary-500">{formData.email}</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div className="md:col-span-2">
            <label
              htmlFor="full_name"
              className="block text-sm font-medium text-primary-700 mb-2"
            >
              Nombre completo
            </label>
            <div className="relative">
              <User
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400"
              />
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Company Name */}
          <div className="md:col-span-2">
            <label
              htmlFor="company_name"
              className="block text-sm font-medium text-primary-700 mb-2"
            >
              Nombre del hospedaje / Empresa
            </label>
            <div className="relative">
              <Building
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400"
              />
              <input
                type="text"
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-primary-700 mb-2"
            >
              Email
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
                readOnly
                className="w-full pl-12 pr-4 py-3 border border-primary-200 bg-primary-50 text-primary-500 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-primary-500 mt-1">
              El email no se puede modificar
            </p>
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-primary-700 mb-2"
            >
              Teléfono
            </label>
            <div className="relative">
              <Phone
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400"
              />
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+34 600 000 000"
                className="w-full pl-12 pr-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label
              htmlFor="address"
              className="block text-sm font-medium text-primary-700 mb-2"
            >
              Dirección
            </label>
            <div className="relative">
              <MapPin
                size={20}
                className="absolute left-4 top-4 text-primary-400"
              />
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                placeholder="Calle, número, código postal, ciudad..."
                className="w-full pl-12 pr-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary-900 text-white font-medium hover:bg-primary-800 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Save size={20} />
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </motion.form>

      {/* Account Info */}
      <div className="bg-primary-50 border border-primary-200 p-6">
        <h3 className="font-medium text-primary-900 mb-2">Información de la cuenta</h3>
        <p className="text-sm text-primary-600">
          Cuenta creada el{' '}
          {profile?.created_at &&
            new Date(profile.created_at).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
        </p>
        <p className="text-sm text-primary-600 mt-1">
          Rol: {profile?.role === 'admin' ? 'Administrador' : 'Usuario'}
        </p>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-200 p-6">
        <h3 className="font-medium text-red-700 mb-2">Zona de peligro</h3>
        <p className="text-sm text-primary-600 mb-4">
          Si deseas eliminar tu cuenta, contacta con nosotros en{' '}
          <a
            href="mailto:info@depuntaachicote.com"
            className="text-primary-900 underline"
          >
            info@depuntaachicote.com
          </a>
        </p>
      </div>
    </div>
  )
}
