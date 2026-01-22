import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Calendar,
  Check,
  X,
  Clock,
  ChevronRight,
  Download,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import type { Budget } from '../../types/database'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const statusConfig = {
  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-700', icon: FileText },
  sent: { label: 'Enviado', color: 'bg-blue-100 text-blue-700', icon: Clock },
  accepted: { label: 'Aceptado', color: 'bg-green-100 text-green-700', icon: Check },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700', icon: X },
  expired: { label: 'Expirado', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
}

export default function UserBudgets() {
  const { profile } = useAuth()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)

  useEffect(() => {
    if (profile?.id) {
      fetchBudgets()
    }
  }, [profile?.id])

  const fetchBudgets = async () => {
    if (!profile?.id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBudgets((data || []) as Budget[])
    } catch (error) {
      console.error('Error fetching budgets:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-primary-900">Presupuestos</h1>
        <p className="mt-1 text-primary-600">Revisa tus presupuestos y propuestas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-primary-200 p-4">
          <p className="text-2xl font-bold text-primary-900">{budgets.length}</p>
          <p className="text-sm text-primary-500">Total presupuestos</p>
        </div>
        <div className="bg-white border border-primary-200 p-4">
          <p className="text-2xl font-bold text-green-600">
            {budgets.filter((b) => b.status === 'accepted').length}
          </p>
          <p className="text-sm text-primary-500">Aceptados</p>
        </div>
        <div className="bg-white border border-primary-200 p-4">
          <p className="text-2xl font-bold text-blue-600">
            {budgets.filter((b) => b.status === 'sent').length}
          </p>
          <p className="text-sm text-primary-500">Pendientes</p>
        </div>
        <div className="bg-white border border-primary-200 p-4">
          <p className="text-2xl font-bold text-primary-900">
            {formatCurrency(
              budgets
                .filter((b) => b.status === 'accepted')
                .reduce((sum, b) => sum + b.total, 0)
            )}
          </p>
          <p className="text-sm text-primary-500">Total aceptado</p>
        </div>
      </div>

      {/* Budgets List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : budgets.length > 0 ? (
        <div className="bg-white border border-primary-200 divide-y divide-primary-100">
          {budgets.map((budget, index) => {
            const status = statusConfig[budget.status]

            return (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 lg:p-6 hover:bg-primary-50 transition-colors cursor-pointer"
                onClick={() => setSelectedBudget(budget)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-primary-500">
                        {budget.budget_number}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <h3 className="mt-2 font-medium text-primary-900">{budget.title}</h3>
                    {budget.description && (
                      <p className="mt-1 text-sm text-primary-500 line-clamp-1">
                        {budget.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-4 text-sm text-primary-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(budget.created_at)}
                      </span>
                      {budget.valid_until && (
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          Válido hasta {formatDate(budget.valid_until)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-primary-900">
                      {formatCurrency(budget.total)}
                    </p>
                    <p className="text-sm text-primary-500">IVA incluido</p>
                    <ChevronRight
                      size={20}
                      className="mt-2 text-primary-400 ml-auto"
                    />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-primary-200">
          <FileText size={48} className="mx-auto text-primary-300 mb-4" />
          <p className="text-primary-600">No tienes presupuestos</p>
          <p className="text-sm text-primary-500 mt-2">
            Cuando recibas un presupuesto, aparecerá aquí.
          </p>
        </div>
      )}

      {/* Budget Detail Modal */}
      {selectedBudget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedBudget(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-primary-200">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-sm text-primary-500">
                    {selectedBudget.budget_number}
                  </span>
                  <h2 className="mt-1 font-display text-2xl font-bold text-primary-900">
                    {selectedBudget.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedBudget(null)}
                  className="p-2 text-primary-400 hover:text-primary-900"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {selectedBudget.description && (
                <p className="text-primary-600">{selectedBudget.description}</p>
              )}

              {/* Items */}
              <div>
                <h3 className="font-medium text-primary-900 mb-3">Conceptos</h3>
                <div className="border border-primary-200 divide-y divide-primary-100">
                  {(selectedBudget.items as Array<{ description: string; quantity: number; price: number }>).map(
                    (item, i) => (
                      <div key={i} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="text-primary-900">{item.description}</p>
                          <p className="text-sm text-primary-500">
                            {item.quantity} x {formatCurrency(item.price)}
                          </p>
                        </div>
                        <p className="font-medium text-primary-900">
                          {formatCurrency(item.quantity * item.price)}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-primary-200 pt-4 space-y-2">
                <div className="flex items-center justify-between text-primary-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedBudget.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-primary-600">
                  <span>IVA ({selectedBudget.tax_rate}%)</span>
                  <span>{formatCurrency(selectedBudget.tax_amount)}</span>
                </div>
                <div className="flex items-center justify-between text-xl font-bold text-primary-900 pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(selectedBudget.total)}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedBudget.notes && (
                <div className="bg-primary-50 p-4 border border-primary-200">
                  <p className="text-sm font-medium text-primary-700 mb-1">Notas:</p>
                  <p className="text-sm text-primary-600">{selectedBudget.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-4 pt-4">
                <button className="px-4 py-2 text-primary-600 hover:text-primary-900 flex items-center gap-2">
                  <Download size={18} />
                  Descargar PDF
                </button>
                {selectedBudget.status === 'sent' && (
                  <button className="px-6 py-2 bg-green-600 text-white hover:bg-green-700">
                    Aceptar presupuesto
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
