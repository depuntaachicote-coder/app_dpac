import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Receipt,
  Calendar,
  Check,
  AlertCircle,
  Clock,
  Download,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import type { Invoice } from '../../types/database'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const statusConfig = {
  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-700', icon: Receipt },
  sent: { label: 'Pendiente', color: 'bg-blue-100 text-blue-700', icon: Clock },
  paid: { label: 'Pagada', color: 'bg-green-100 text-green-700', icon: Check },
  overdue: { label: 'Vencida', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  cancelled: { label: 'Cancelada', color: 'bg-gray-100 text-gray-700', icon: X },
}

export default function UserInvoices() {
  const { profile } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    if (profile?.id) {
      fetchInvoices()
    }
  }, [profile?.id])

  const fetchInvoices = async () => {
    if (!profile?.id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvoices((data || []) as Invoice[])
    } catch (error) {
      console.error('Error fetching invoices:', error)
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

  const pendingAmount = invoices
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.total, 0)

  const paidAmount = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.total, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-primary-900">Facturas</h1>
        <p className="mt-1 text-primary-600">Gestiona tu facturación</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-primary-200 p-4">
          <p className="text-2xl font-bold text-primary-900">{invoices.length}</p>
          <p className="text-sm text-primary-500">Total facturas</p>
        </div>
        <div className="bg-white border border-primary-200 p-4">
          <p className="text-2xl font-bold text-green-600">
            {invoices.filter((i) => i.status === 'paid').length}
          </p>
          <p className="text-sm text-primary-500">Pagadas</p>
        </div>
        <div className="bg-white border border-primary-200 p-4">
          <p className="text-2xl font-bold text-orange-600">
            {formatCurrency(pendingAmount)}
          </p>
          <p className="text-sm text-primary-500">Pendiente</p>
        </div>
        <div className="bg-white border border-primary-200 p-4">
          <p className="text-2xl font-bold text-primary-900">
            {formatCurrency(paidAmount)}
          </p>
          <p className="text-sm text-primary-500">Total pagado</p>
        </div>
      </div>

      {/* Invoices List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : invoices.length > 0 ? (
        <div className="bg-white border border-primary-200 divide-y divide-primary-100">
          {invoices.map((invoice, index) => {
            const status = statusConfig[invoice.status]

            return (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 lg:p-6 hover:bg-primary-50 transition-colors cursor-pointer"
                onClick={() => setSelectedInvoice(invoice)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-primary-500">
                        {invoice.invoice_number}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <h3 className="mt-2 font-medium text-primary-900">{invoice.title}</h3>
                    <div className="mt-3 flex items-center gap-4 text-sm text-primary-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(invoice.created_at)}
                      </span>
                      {invoice.due_date && (
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          Vence: {formatDate(invoice.due_date)}
                        </span>
                      )}
                      {invoice.paid_at && (
                        <span className="flex items-center gap-1 text-green-600">
                          <Check size={14} />
                          Pagada: {formatDate(invoice.paid_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-primary-900">
                      {formatCurrency(invoice.total)}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // Download PDF logic here
                      }}
                      className="mt-2 text-sm text-primary-600 hover:text-primary-900 flex items-center gap-1 ml-auto"
                    >
                      <Download size={14} />
                      PDF
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-primary-200">
          <Receipt size={48} className="mx-auto text-primary-300 mb-4" />
          <p className="text-primary-600">No tienes facturas</p>
          <p className="text-sm text-primary-500 mt-2">
            Cuando recibas una factura, aparecerá aquí.
          </p>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedInvoice(null)}
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
                    {selectedInvoice.invoice_number}
                  </span>
                  <h2 className="mt-1 font-display text-2xl font-bold text-primary-900">
                    {selectedInvoice.title}
                  </h2>
                  <p className="mt-1 text-sm text-primary-500">
                    Emitida: {formatDate(selectedInvoice.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-2 text-primary-400 hover:text-primary-900"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 text-sm font-medium ${
                    statusConfig[selectedInvoice.status].color
                  }`}
                >
                  {statusConfig[selectedInvoice.status].label}
                </span>
                {selectedInvoice.due_date &&
                  selectedInvoice.status !== 'paid' && (
                    <span className="text-sm text-primary-500">
                      Vencimiento: {formatDate(selectedInvoice.due_date)}
                    </span>
                  )}
              </div>

              {/* Items */}
              <div>
                <h3 className="font-medium text-primary-900 mb-3">Conceptos</h3>
                <div className="border border-primary-200 divide-y divide-primary-100">
                  {(selectedInvoice.items as Array<{ description: string; quantity: number; price: number }>).map(
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
                  <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-primary-600">
                  <span>IVA ({selectedInvoice.tax_rate}%)</span>
                  <span>{formatCurrency(selectedInvoice.tax_amount)}</span>
                </div>
                <div className="flex items-center justify-between text-xl font-bold text-primary-900 pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(selectedInvoice.total)}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedInvoice.notes && (
                <div className="bg-primary-50 p-4 border border-primary-200">
                  <p className="text-sm font-medium text-primary-700 mb-1">Notas:</p>
                  <p className="text-sm text-primary-600">{selectedInvoice.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-4 pt-4">
                <button className="px-6 py-2 bg-primary-900 text-white hover:bg-primary-800 flex items-center gap-2">
                  <Download size={18} />
                  Descargar PDF
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
