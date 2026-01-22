import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Mail, Building, Calendar, Shield, User as UserIcon } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Profile } from '../../types/database'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole } as never)
        .eq('id', userId)

      if (error) throw error
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole as 'admin' | 'user' } : u)))
    } catch (error) {
      console.error('Error updating role:', error)
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-primary-900">Usuarios</h1>
        <p className="mt-1 text-primary-600">Gestiona los usuarios registrados</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400"
        />
        <input
          type="text"
          placeholder="Buscar por email, nombre o empresa..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none transition-colors bg-white"
        />
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="bg-white border border-primary-200">
          <div className="hidden lg:grid grid-cols-5 gap-4 px-6 py-4 bg-primary-50 border-b border-primary-200 text-sm font-medium text-primary-600">
            <div>Usuario</div>
            <div>Empresa</div>
            <div>Contacto</div>
            <div>Fecha registro</div>
            <div className="text-right">Rol</div>
          </div>

          <div className="divide-y divide-primary-100">
            {filteredUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                className="p-6 hover:bg-primary-50 transition-colors"
              >
                <div className="lg:hidden space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.full_name || ''}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <UserIcon size={20} className="text-primary-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-primary-900">
                          {user.full_name || 'Sin nombre'}
                        </p>
                        <p className="text-sm text-primary-500">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleRole(user.id, user.role)}
                      className={`px-3 py-1 text-sm font-medium ${
                        user.role === 'admin'
                          ? 'bg-primary-900 text-white'
                          : 'bg-primary-100 text-primary-700'
                      }`}
                    >
                      {user.role === 'admin' ? 'Admin' : 'Usuario'}
                    </button>
                  </div>
                  {user.company_name && (
                    <p className="text-sm text-primary-600 flex items-center gap-2">
                      <Building size={14} />
                      {user.company_name}
                    </p>
                  )}
                </div>

                <div className="hidden lg:grid lg:grid-cols-5 lg:gap-4 lg:items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name || ''}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <UserIcon size={20} className="text-primary-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-primary-900">
                        {user.full_name || 'Sin nombre'}
                      </p>
                    </div>
                  </div>

                  <div>
                    {user.company_name ? (
                      <span className="text-primary-700">{user.company_name}</span>
                    ) : (
                      <span className="text-primary-400">-</span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-primary-600 flex items-center gap-2">
                      <Mail size={14} />
                      {user.email}
                    </p>
                    {user.phone && (
                      <p className="text-sm text-primary-500">{user.phone}</p>
                    )}
                  </div>

                  <div className="text-sm text-primary-600 flex items-center gap-2">
                    <Calendar size={14} />
                    {new Date(user.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => toggleRole(user.id, user.role)}
                      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                        user.role === 'admin'
                          ? 'bg-primary-900 text-white hover:bg-primary-800'
                          : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                      }`}
                    >
                      <Shield size={14} />
                      {user.role === 'admin' ? 'Admin' : 'Usuario'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-primary-200">
          <p className="text-primary-600">No se encontraron usuarios</p>
        </div>
      )}
    </div>
  )
}
