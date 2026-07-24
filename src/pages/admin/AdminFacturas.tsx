import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Check,
  Send,
  Loader,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Invoice } from '../../types/database'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

type ClientProfile = { id: string; full_name: string; email: string }
type InvoiceWithProfile = Invoice & { profile?: ClientProfile }

const fmt = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

const hasPending = (inv: Invoice) =>
  typeof inv.notes === 'string' && inv.notes.includes('[FACTURA_SOLICITADA]')
const hasSent = (inv: Invoice) =>
  typeof inv.notes === 'string' && inv.notes.includes('[FACTURA_ENVIADA:')

function parseFiscalData(notes: string | null) {
  if (!notes || !notes.includes('[FACTURA_SOLICITADA]')) return null
  const tag = '[FACTURA_SOLICITADA]'
  const start = notes.indexOf(tag) + tag.length
  const rest = notes.slice(start)
  const end = rest.search(/\[FACTURA_/)
  const block = end >= 0 ? rest.slice(0, end) : rest
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
  const get = (prefix: string) => {
    const line = lines.find((l) => l.startsWith(prefix))
    return line ? line.slice(prefix.length).trim() : ''
  }
  return {
    razonSocial: get('Razón Social: '),
    nif: get('NIF/CIF: '),
    direccion: get('Dirección: '),
    cpCiudad: get('CP y Ciudad: '),
    email: get('Email: '),
  }
}

function getSentDate(notes: string | null): string | null {
  if (!notes) return null
  const match = notes.match(/\[FACTURA_ENVIADA:([^\]]+)\]/)
  return match ? match[1] : null
}

export default function AdminFacturas() {
  const [invoices, setInvoices] = useState<InvoiceWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      // @ts-ignore
      const { data: rawInvoices, error: invErr } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })

      if (invErr) throw invErr

      const allInvoices = (rawInvoices || []) as Invoice[]
      const withFactura = allInvoices.filter(
        (inv) =>
          inv.notes?.includes('[FACTURA_SOLICITADA]') ||
          inv.notes?.includes('[FACTURA_ENVIADA:')
      )

      const userIds = [...new Set(withFactura.map((inv) => inv.user_id))]
      const profileMap: Record<string, ClientProfile> = {}

      if (userIds.length > 0) {
        // @ts-ignore
        const { data: rawProfiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds)
        for (const p of (rawProfiles || []) as ClientProfile[]) {
          profileMap[p.id] = p
        }
      }

      const merged: InvoiceWithProfile[] = withFactura.map((inv) => ({
        ...inv,
        profile: profileMap[inv.user_id],
      }))

      // Sort pending first, then by date descending
      merged.sort((a, b) => {
        const diff = (hasPending(a) ? 0 : 1) - (hasPending(b) ? 0 : 1)
        if (diff !== 0) return diff
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      setInvoices(merged)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las solicitudes')
    } finally {
      setLoading(false)
    }
  }

  const sendInvoice = async (invoiceId: string) => {
    setSending(invoiceId)
    setError(null)
    setSuccess(null)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('send-invoice', {
        body: { invoiceId },
      })
      if (fnError) throw fnError
      if (data?.error) throw new Error(data.error)
      setSuccess(`Factura enviada correctamente a ${data.sentTo}`)
      await fetchAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar la factura')
    } finally {
      setSending(null)
    }
  }

  const pending = invoices.filter(hasPending)
  const sent = invoices.filter(hasSent)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary-900">Solicitudes de factura</h1>
          <p className="mt-1 text-primary-600">
            Gestiona y envía las facturas solicitadas por los clientes
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-3 py-2 border border-primary-200 text-primary-700 text-sm hover:bg-primary-50 transition-colors"
        >
          <RefreshCw size={14} />
          Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-primary-200 p-4">
          <p className="text-2xl font-bold text-amber-600">{pending.length}</p>
          <p className="text-sm text-primary-500">Pendientes</p>
        </div>
        <div className="bg-white border border-primary-200 p-4">
          <p className="text-2xl font-bold text-green-600">{sent.length}</p>
          <p className="text-sm text-primary-500">Enviadas</p>
        </div>
        <div className="bg-white border border-primary-200 p-4">
          <p className="text-2xl font-bold text-primary-900">{invoices.length}</p>
          <p className="text-sm text-primary-500">Total</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 p-4 flex items-start gap-2"
        >
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </motion.div>
      )}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 text-green-700 p-4 flex items-center gap-2"
        >
          <Check size={16} />
          <span className="text-sm">{success}</span>
        </motion.div>
      )}

      {/* List */}
      {invoices.length === 0 ? (
        <div className="text-center py-20 bg-white border border-primary-200">
          <FileText size={48} className="mx-auto text-primary-300 mb-4" />
          <p className="text-primary-700 font-medium">No hay solicitudes de factura</p>
          <p className="text-sm text-primary-500 mt-2">
            Aparecerán aquí cuando los clientes soliciten factura desde su panel.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-primary-200 divide-y divide-primary-100">
          {invoices.map((invoice, idx) => {
            const isPending = hasPending(invoice)
            const isSent = hasSent(invoice)
            const fiscal = parseFiscalData(invoice.notes)
            const sentDate = getSentDate(invoice.notes)
            const isExpanded = expanded === invoice.id

            return (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.03 }}
                className="p-4 lg:p-6"
              >
                {/* Main row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`mt-0.5 p-2 rounded-lg flex-shrink-0 ${
                        isPending ? 'bg-amber-100' : 'bg-green-100'
                      }`}
                    >
                      <FileText
                        size={16}
                        className={isPending ? 'text-amber-700' : 'text-green-700'}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-primary-400">
                          {invoice.invoice_number}
                        </span>
                        {isPending && (
                          <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-800 rounded">
                            Pendiente de envío
                          </span>
                        )}
                        {isSent && (
                          <span className="px-2 py-0.5 text-[11px] font-semibold bg-green-100 text-green-800 rounded inline-flex items-center gap-1">
                            <Check size={10} />
                            Enviada
                          </span>
                        )}
                      </div>

                      <p className="mt-1 font-medium text-primary-900 truncate">{invoice.title}</p>

                      {/* Client info */}
                      <p className="mt-1 text-sm text-primary-600">
                        {invoice.profile?.full_name && (
                          <span className="font-medium">{invoice.profile.full_name}</span>
                        )}
                        {invoice.profile?.email && (
                          <span className="ml-2 text-primary-400">
                            {invoice.profile.email}
                          </span>
                        )}
                      </p>

                      {/* Fiscal data summary */}
                      {fiscal && (
                        <p className="mt-0.5 text-xs text-primary-400">
                          {fiscal.razonSocial && <span>{fiscal.razonSocial}</span>}
                          {fiscal.nif && <span className="ml-2">· NIF {fiscal.nif}</span>}
                          {fiscal.email && <span className="ml-2">· {fiscal.email}</span>}
                        </p>
                      )}

                      {/* Sent date */}
                      {sentDate && (
                        <p className="mt-1 text-xs text-green-600">
                          Enviada el {fmtDate(sentDate)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right side: amount + actions */}
                  <div className="text-right flex-shrink-0 space-y-2">
                    <p className="text-xl font-bold text-primary-900">{fmt(invoice.total)}</p>
                    <p className="text-xs text-primary-400">{fmtDate(invoice.created_at)}</p>

                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setExpanded(isExpanded ? null : invoice.id)}
                        className="text-xs text-primary-500 hover:text-primary-900 flex items-center gap-1 transition-colors"
                      >
                        {isExpanded ? (
                          <><EyeOff size={12} />Ocultar</>
                        ) : (
                          <><Eye size={12} />Ver datos</>
                        )}
                      </button>

                      {isPending && (
                        <button
                          onClick={() => sendInvoice(invoice.id)}
                          disabled={!!sending}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-900 text-white text-xs font-semibold hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sending === invoice.id ? (
                            <>
                              <Loader size={12} className="animate-spin" />
                              Enviando…
                            </>
                          ) : (
                            <>
                              <Send size={12} />
                              Enviar factura
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded fiscal data */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 ml-11 p-4 bg-primary-50 border border-primary-100 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm"
                  >
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-primary-400 font-semibold mb-1">
                        Razón social
                      </p>
                      <p className="text-primary-900 font-medium">{fiscal?.razonSocial || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-primary-400 font-semibold mb-1">
                        NIF / CIF
                      </p>
                      <p className="text-primary-900 font-medium">{fiscal?.nif || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-primary-400 font-semibold mb-1">
                        Email de facturación
                      </p>
                      <p className="text-primary-900">{fiscal?.email || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-primary-400 font-semibold mb-1">
                        Dirección fiscal
                      </p>
                      <p className="text-primary-900">{fiscal?.direccion || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-primary-400 font-semibold mb-1">
                        CP y ciudad
                      </p>
                      <p className="text-primary-900">{fiscal?.cpCiudad || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-primary-400 font-semibold mb-1">
                        Importe factura
                      </p>
                      <p className="text-primary-900">
                        {fmt(invoice.subtotal)} + IVA {invoice.tax_rate}% ={' '}
                        <strong>{fmt(invoice.total)}</strong>
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
