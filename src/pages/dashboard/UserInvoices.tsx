import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Receipt,
  Calendar,
  Check,
  Download,
  X,
  Printer,
  ShoppingBag,
  FileText,
  Send,
  ClipboardList,
  Loader,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import type { Invoice } from '../../types/database'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

// ── Company data ──────────────────────────────────────────────────────────────
const COMPANY = {
  name: 'GRUPO NORAN HOMES S.L.',
  brand: 'De Punta a Chicote',
  address: 'Av. Orense, 47, 4ºC',
  city: '36900 Marín, Pontevedra',
  email: 'hola@depuntaachicote.com',
  cif: 'B27619410',
  ivaRate: 21,
}

type InvoiceItem = { description: string; quantity: number; price: number }

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (amount: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)

const fmtDate = (date: string) =>
  new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

// ── Print function ────────────────────────────────────────────────────────────
function printReceipt(invoice: Invoice, clientName: string, clientEmail: string) {
  const items = invoice.items as InvoiceItem[]

  const rows = items.map((item) => `
    <tr>
      <td>${item.description}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">${fmt(item.price)}</td>
      <td style="text-align:right">${fmt(item.quantity * item.price)}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Recibo ${invoice.invoice_number} — De Punta a Chicote</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Helvetica Neue',Arial,sans-serif;color:#111827;padding:48px;max-width:800px;margin:0 auto}
  header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:48px;padding-bottom:32px;border-bottom:2px solid #0f172a}
  .brand{font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.5px}
  .legal{font-size:11px;color:#64748b;margin-top:2px;font-weight:600;letter-spacing:0.03em}
  .address{margin-top:12px;font-size:12.5px;color:#475569;line-height:1.8}
  .receipt-meta{text-align:right}
  .receipt-label{font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;margin-bottom:4px}
  .receipt-number{font-size:22px;font-weight:800;color:#0f172a}
  .receipt-date{font-size:12px;color:#64748b;margin-top:8px;line-height:1.7}
  .badge{display:inline-block;background:#dcfce7;color:#166534;padding:3px 10px;border-radius:3px;font-size:11px;font-weight:700;margin-top:10px;letter-spacing:0.04em}
  .parties{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-bottom:36px}
  .party-label{font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;margin-bottom:8px;font-weight:600}
  .party-name{font-size:14px;font-weight:700;color:#0f172a}
  .party-info{font-size:12.5px;color:#475569;line-height:1.7;margin-top:4px}
  table{width:100%;border-collapse:collapse;margin-bottom:0}
  th{background:#0f172a;color:#fff;padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:600}
  td{padding:12px 14px;border-bottom:1px solid #e2e8f0;font-size:13.5px;color:#1e293b}
  tr:last-child td{border-bottom:none}
  tr:nth-child(even) td{background:#f8fafc}
  .totals-wrap{display:flex;justify-content:flex-end;margin-top:0;border-top:2px solid #e2e8f0}
  .totals{width:280px;padding:20px 0 0}
  .totals-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13.5px;color:#475569}
  .totals-divider{border-top:2px solid #0f172a;margin:10px 0}
  .totals-total{display:flex;justify-content:space-between;font-weight:800;font-size:18px;color:#0f172a;padding-top:4px}
  .footer{margin-top:48px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;line-height:1.6}
  @media print{body{padding:20px}@page{margin:1cm}}
</style>
</head>
<body>

<header>
  <div>
    <div class="brand">De Punta a Chicote</div>
    <div class="legal">${COMPANY.name}</div>
    <div class="address">
      ${COMPANY.address}<br>
      ${COMPANY.city}<br>
      ${COMPANY.email}<br>
      CIF: ${COMPANY.cif}
    </div>
  </div>
  <div class="receipt-meta">
    <div class="receipt-label">Recibo de compra</div>
    <div class="receipt-number">${invoice.invoice_number}</div>
    <div class="receipt-date">
      Emitido: ${fmtDate(invoice.created_at)}<br>
      ${invoice.paid_at ? `Pagado: ${fmtDate(invoice.paid_at)}` : ''}
    </div>
    <div><span class="badge">✓ PAGADO</span></div>
  </div>
</header>

<div class="parties">
  <div>
    <div class="party-label">Emisor</div>
    <div class="party-name">${COMPANY.name}</div>
    <div class="party-info">
      ${COMPANY.brand}<br>
      ${COMPANY.address}<br>
      ${COMPANY.city}<br>
      CIF: ${COMPANY.cif}
    </div>
  </div>
  <div>
    <div class="party-label">Cliente</div>
    <div class="party-name">${clientName || 'Cliente'}</div>
    <div class="party-info">${clientEmail}</div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>Descripción</th>
      <th style="text-align:center">Cantidad</th>
      <th style="text-align:right">Precio unitario (sin IVA)</th>
      <th style="text-align:right">Importe</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>

<div class="totals-wrap">
  <div class="totals">
    <div class="totals-row"><span>Subtotal</span><span>${fmt(invoice.subtotal)}</span></div>
    <div class="totals-row"><span>IVA (${invoice.tax_rate}%)</span><span>${fmt(invoice.tax_amount)}</span></div>
    <div class="totals-divider"></div>
    <div class="totals-total"><span>Total</span><span>${fmt(invoice.total)}</span></div>
  </div>
</div>

<div class="footer">
  Este documento acredita el pago realizado y sirve como comprobante de compra.
  Conserve este recibo para sus registros contables.<br>
  ${COMPANY.name} · ${COMPANY.brand} · ${COMPANY.address} · ${COMPANY.city} · CIF ${COMPANY.cif}
</div>

<script>window.onload=function(){window.print()}<\/script>
</body>
</html>`

  const w = window.open('', '_blank', 'width=860,height=960')
  if (w) {
    w.document.write(html)
    w.document.close()
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function UserInvoices() {
  const { profile } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  // ── Solicitar factura ───────────────────────────────────────────────────────
  const [requestModal, setRequestModal] = useState<Invoice | null>(null)
  const [requestForm, setRequestForm] = useState({
    razonSocial: '', nif: '', direccion: '', cp: '', ciudad: '', email: '',
  })
  const [requestSending, setRequestSending] = useState(false)
  const [requestSuccess, setRequestSuccess] = useState(false)

  const hasFacturaRequested = (inv: Invoice) =>
    typeof inv.notes === 'string' && inv.notes.includes('[FACTURA_SOLICITADA]')

  const hasFacturaEnviada = (inv: Invoice) =>
    typeof inv.notes === 'string' && inv.notes.includes('[FACTURA_ENVIADA:')

  const openRequestModal = (inv: Invoice, e: React.MouseEvent) => {
    e.stopPropagation()
    setRequestModal(inv)
    setRequestSuccess(false)
    setRequestError(null)
    setRequestForm({
      razonSocial: profile?.full_name ?? '',
      nif: '',
      direccion: '',
      cp: '',
      ciudad: '',
      email: profile?.email ?? '',
    })
  }

  const [requestError, setRequestError] = useState<string | null>(null)

  const submitInvoiceRequest = async () => {
    if (!requestModal) return
    const { razonSocial, nif, direccion, cp, ciudad, email } = requestForm
    if (!razonSocial.trim() || !nif.trim() || !email.trim()) return
    setRequestSending(true)
    setRequestError(null)
    try {
      const fiscalBlock = [
        '[FACTURA_SOLICITADA]',
        `Razón Social: ${razonSocial}`,
        `NIF/CIF: ${nif}`,
        `Dirección: ${direccion}`,
        `CP y Ciudad: ${cp} ${ciudad}`,
        `Email: ${email}`,
      ].join('\n')
      const prevNotes = requestModal.notes ?? ''
      const newNotes = prevNotes ? `${prevNotes}\n\n${fiscalBlock}` : fiscalBlock
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ notes: newNotes } as never)
        .eq('id', requestModal.id)
      if (updateError) {
        setRequestError('No se pudo guardar la solicitud. Comprueba tu conexión e inténtalo de nuevo.')
        return
      }
      setRequestSuccess(true)
      await fetchInvoices()
    } catch {
      setRequestError('Error inesperado al enviar la solicitud.')
    } finally {
      setRequestSending(false)
    }
  }

  useEffect(() => {
    if (profile?.id) fetchInvoices()
  }, [profile?.id])

  const fetchInvoices = async () => {
    if (!profile?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setInvoices((data || []) as Invoice[])
    } catch {
    } finally {
      setLoading(false)
    }
  }

  // Distinguish media receipts from budget invoices
  const isMediaReceipt = (inv: Invoice) =>
    typeof inv.description === 'string' && inv.description.startsWith('stripe:')

  const paidAmount = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-primary-900">Facturas y recibos</h1>
        <p className="mt-1 text-primary-600">Historial de compras y facturación</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-primary-200 p-4">
          <p className="text-2xl font-bold text-primary-900">{invoices.length}</p>
          <p className="text-sm text-primary-500">Total documentos</p>
        </div>
        <div className="bg-white border border-primary-200 p-4">
          <p className="text-2xl font-bold text-green-600">
            {invoices.filter(i => i.status === 'paid').length}
          </p>
          <p className="text-sm text-primary-500">Pagados</p>
        </div>
        <div className="bg-white border border-primary-200 p-4">
          <p className="text-2xl font-bold text-primary-900">{fmt(paidAmount)}</p>
          <p className="text-sm text-primary-500">Total pagado</p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : invoices.length > 0 ? (
        <div className="bg-white border border-primary-200 divide-y divide-primary-100">
          {invoices.map((invoice, idx) => {
            const isMedia = isMediaReceipt(invoice)
            return (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.04 }}
                className="p-4 lg:p-6 hover:bg-primary-50 transition-colors cursor-pointer"
                onClick={() => setSelectedInvoice(invoice)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`mt-0.5 p-2 rounded-lg flex-shrink-0 ${isMedia ? 'bg-amber-100' : 'bg-primary-100'}`}>
                      {isMedia
                        ? <ShoppingBag size={16} className="text-amber-700" />
                        : <FileText size={16} className="text-primary-600" />
                      }
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-primary-400">{invoice.invoice_number}</span>
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-green-100 text-green-800 rounded">
                          Pagado
                        </span>
                        {isMedia && (
                          <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-800 rounded">
                            Compra multimedia
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-medium text-primary-900 truncate">{invoice.title}</p>
                      <p className="mt-1 text-sm text-primary-500 flex items-center gap-1">
                        <Calendar size={13} />
                        {fmtDate(invoice.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 space-y-2">
                    <p className="text-xl font-bold text-primary-900">{fmt(invoice.total)}</p>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        printReceipt(invoice, profile?.full_name ?? '', profile?.email ?? '')
                      }}
                      className="text-sm text-primary-500 hover:text-primary-900 flex items-center gap-1 ml-auto transition-colors"
                    >
                      <Printer size={13} />
                      Imprimir / PDF
                    </button>

                    {hasFacturaEnviada(invoice) ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-green-700 ml-auto justify-end">
                        <Check size={11} />
                        Factura enviada
                      </span>
                    ) : hasFacturaRequested(invoice) ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 ml-auto justify-end">
                        <Check size={11} />
                        Factura solicitada
                      </span>
                    ) : (
                      <button
                        onClick={(e) => openRequestModal(invoice, e)}
                        className="flex items-center gap-1 text-[12px] font-semibold text-primary-700 hover:text-primary-900 ml-auto transition-colors border border-primary-200 px-2 py-1 hover:bg-primary-50"
                      >
                        <ClipboardList size={12} />
                        Solicitar factura
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-primary-200">
          <Receipt size={48} className="mx-auto text-primary-300 mb-4" />
          <p className="text-primary-700 font-medium">No hay facturas todavía</p>
          <p className="text-sm text-primary-500 mt-2">
            Los recibos de tus compras de archivos aparecerán aquí.
          </p>
        </div>
      )}

      {/* Receipt detail modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setSelectedInvoice(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="bg-white w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="sticky top-0 bg-white border-b border-primary-200 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <p className="font-mono text-xs text-primary-400">{selectedInvoice.invoice_number}</p>
                  <h2 className="font-display text-xl font-bold text-primary-900 mt-0.5">
                    {selectedInvoice.title}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => printReceipt(selectedInvoice, profile?.full_name ?? '', profile?.email ?? '')}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white text-sm font-medium hover:bg-primary-800 transition-colors"
                  >
                    <Printer size={15} />
                    Imprimir / PDF
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="p-2 text-primary-400 hover:text-primary-900 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-8">

                {/* Company + Receipt meta */}
                <div className="flex flex-col sm:flex-row sm:justify-between gap-6 pb-6 border-b-2 border-primary-900">
                  {/* Company */}
                  <div>
                    <p className="font-display text-xl font-bold text-primary-900">De Punta a Chicote</p>
                    <p className="text-xs font-semibold text-primary-500 mt-0.5 uppercase tracking-wider">{COMPANY.name}</p>
                    <div className="mt-3 text-sm text-primary-600 space-y-0.5 leading-relaxed">
                      <p>{COMPANY.address}</p>
                      <p>{COMPANY.city}</p>
                      <p>{COMPANY.email}</p>
                      <p className="font-medium">CIF: {COMPANY.cif}</p>
                    </div>
                  </div>
                  {/* Receipt meta */}
                  <div className="sm:text-right">
                    <p className="text-[10px] uppercase tracking-widest text-primary-400 font-semibold">Recibo de compra</p>
                    <p className="font-mono text-2xl font-bold text-primary-900 mt-1">{selectedInvoice.invoice_number}</p>
                    <div className="mt-2 text-sm text-primary-500 space-y-0.5">
                      <p className="flex sm:justify-end items-center gap-1.5">
                        <Calendar size={13} />
                        {fmtDate(selectedInvoice.created_at)}
                      </p>
                      {selectedInvoice.paid_at && (
                        <p className="flex sm:justify-end items-center gap-1.5 text-green-700 font-medium">
                          <Check size={13} />
                          Pagado el {fmtDate(selectedInvoice.paid_at)}
                        </p>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-green-100 text-green-800 text-xs font-bold rounded">
                      <Check size={12} />
                      PAGADO
                    </span>
                  </div>
                </div>

                {/* Parties */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-primary-400 font-semibold mb-2">Emisor</p>
                    <p className="font-semibold text-primary-900 text-sm">{COMPANY.name}</p>
                    <div className="text-sm text-primary-600 mt-1 space-y-0.5 leading-relaxed">
                      <p>{COMPANY.brand}</p>
                      <p>{COMPANY.address}</p>
                      <p>{COMPANY.city}</p>
                      <p>CIF: {COMPANY.cif}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-primary-400 font-semibold mb-2">Cliente</p>
                    <p className="font-semibold text-primary-900 text-sm">{profile?.full_name || 'Cliente'}</p>
                    <p className="text-sm text-primary-600 mt-1">{profile?.email}</p>
                  </div>
                </div>

                {/* Line items table */}
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-primary-400 font-semibold mb-3">Conceptos</p>
                  <div className="border border-primary-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-primary-900 text-white">
                          <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">Descripción</th>
                          <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wider">Cant.</th>
                          <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider">Precio unit.</th>
                          <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider">Importe</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-primary-100">
                        {(selectedInvoice.items as InvoiceItem[]).map((item, i) => (
                          <tr key={i} className={i % 2 === 1 ? 'bg-primary-50/40' : ''}>
                            <td className="px-4 py-3 text-primary-900">{item.description}</td>
                            <td className="px-4 py-3 text-center text-primary-700">{item.quantity}</td>
                            <td className="px-4 py-3 text-right text-primary-700">{fmt(item.price)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-primary-900">{fmt(item.quantity * item.price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-72 space-y-2 border-t-2 border-primary-200 pt-4">
                    <div className="flex justify-between text-sm text-primary-600">
                      <span>Subtotal (sin IVA)</span>
                      <span>{fmt(selectedInvoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-primary-600">
                      <span>IVA ({selectedInvoice.tax_rate}%)</span>
                      <span>{fmt(selectedInvoice.tax_amount)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-primary-900 border-t-2 border-primary-900 pt-3 mt-2">
                      <span>Total</span>
                      <span>{fmt(selectedInvoice.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer note */}
                <div className="bg-primary-50 border border-primary-200 p-4">
                  <p className="text-xs text-primary-500 leading-relaxed">
                    Este documento acredita el pago realizado y sirve como comprobante de compra.
                    Conserve este recibo para sus registros contables.<br />
                    <span className="font-medium">{COMPANY.name} · CIF {COMPANY.cif}</span>
                  </p>
                </div>

                {/* Download action */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="px-5 py-2.5 border border-primary-200 text-primary-700 text-sm hover:bg-primary-50 transition-colors"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => printReceipt(selectedInvoice, profile?.full_name ?? '', profile?.email ?? '')}
                    className="px-5 py-2.5 bg-primary-900 text-white text-sm font-medium hover:bg-primary-800 transition-colors flex items-center gap-2"
                  >
                    <Download size={16} />
                    Guardar como PDF
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Solicitar factura modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {requestModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => { if (!requestSending) setRequestModal(null) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="bg-white w-full max-w-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-primary-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <ClipboardList size={18} className="text-primary-700" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-primary-900">Solicitar factura</h3>
                    <p className="text-xs text-primary-500 font-mono">{requestModal.invoice_number}</p>
                  </div>
                </div>
                <button
                  onClick={() => setRequestModal(null)}
                  disabled={requestSending}
                  className="p-2 text-primary-400 hover:text-primary-900 transition-colors disabled:opacity-40"
                >
                  <X size={18} />
                </button>
              </div>

              {requestSuccess ? (
                /* ── Confirmation ── */
                <div className="px-6 py-10 text-center space-y-4">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Check size={28} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-display text-xl font-bold text-primary-900">¡Solicitud enviada!</p>
                    <p className="text-sm text-primary-600 mt-2 leading-relaxed">
                      Hemos recibido tu solicitud de factura. Recibirás el documento
                      en un plazo máximo de <strong>48 horas hábiles</strong> en el email indicado.
                    </p>
                  </div>
                  <button
                    onClick={() => setRequestModal(null)}
                    className="mt-2 px-6 py-2.5 bg-primary-900 text-white text-sm font-medium hover:bg-primary-800 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                /* ── Form ── */
                <div className="px-6 py-5 space-y-4">
                  <p className="text-sm text-primary-600">
                    Introduce tus datos fiscales y te enviaremos la factura oficial con IVA desglosado.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Razón Social — full width */}
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-primary-700 uppercase tracking-wider mb-1.5">
                        Nombre / Razón Social <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={requestForm.razonSocial}
                        onChange={(e) => setRequestForm(f => ({ ...f, razonSocial: e.target.value }))}
                        placeholder="EMPRESA S.L. o Nombre Apellidos"
                        className="w-full border border-primary-200 px-3 py-2.5 text-sm text-primary-900 focus:outline-none focus:border-primary-900 transition-colors"
                      />
                    </div>

                    {/* NIF/CIF */}
                    <div>
                      <label className="block text-xs font-semibold text-primary-700 uppercase tracking-wider mb-1.5">
                        NIF / CIF <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={requestForm.nif}
                        onChange={(e) => setRequestForm(f => ({ ...f, nif: e.target.value }))}
                        placeholder="B12345678 / 12345678A"
                        className="w-full border border-primary-200 px-3 py-2.5 text-sm text-primary-900 focus:outline-none focus:border-primary-900 transition-colors"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-primary-700 uppercase tracking-wider mb-1.5">
                        Email de envío <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={requestForm.email}
                        onChange={(e) => setRequestForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="facturacion@empresa.com"
                        className="w-full border border-primary-200 px-3 py-2.5 text-sm text-primary-900 focus:outline-none focus:border-primary-900 transition-colors"
                      />
                    </div>

                    {/* Dirección — full width */}
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-primary-700 uppercase tracking-wider mb-1.5">
                        Dirección fiscal
                      </label>
                      <input
                        type="text"
                        value={requestForm.direccion}
                        onChange={(e) => setRequestForm(f => ({ ...f, direccion: e.target.value }))}
                        placeholder="Calle Mayor, 1, 2ºA"
                        className="w-full border border-primary-200 px-3 py-2.5 text-sm text-primary-900 focus:outline-none focus:border-primary-900 transition-colors"
                      />
                    </div>

                    {/* CP */}
                    <div>
                      <label className="block text-xs font-semibold text-primary-700 uppercase tracking-wider mb-1.5">
                        Código postal
                      </label>
                      <input
                        type="text"
                        value={requestForm.cp}
                        onChange={(e) => setRequestForm(f => ({ ...f, cp: e.target.value }))}
                        placeholder="28001"
                        className="w-full border border-primary-200 px-3 py-2.5 text-sm text-primary-900 focus:outline-none focus:border-primary-900 transition-colors"
                      />
                    </div>

                    {/* Ciudad */}
                    <div>
                      <label className="block text-xs font-semibold text-primary-700 uppercase tracking-wider mb-1.5">
                        Ciudad / Municipio
                      </label>
                      <input
                        type="text"
                        value={requestForm.ciudad}
                        onChange={(e) => setRequestForm(f => ({ ...f, ciudad: e.target.value }))}
                        placeholder="Madrid"
                        className="w-full border border-primary-200 px-3 py-2.5 text-sm text-primary-900 focus:outline-none focus:border-primary-900 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Info box */}
                  <div className="bg-primary-50 border border-primary-200 p-3 flex gap-2.5">
                    <Receipt size={15} className="text-primary-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-primary-600 leading-relaxed">
                      La factura será emitida por <strong>GRUPO NORAN HOMES S.L.</strong> (De Punta a Chicote)
                      e incluirá el desglose de IVA. Te la enviaremos en un plazo de 48&nbsp;h hábiles.
                    </p>
                  </div>

                  {requestError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 text-xs">
                      {requestError}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-1">
                    <button
                      onClick={() => setRequestModal(null)}
                      disabled={requestSending}
                      className="px-5 py-2.5 border border-primary-200 text-primary-700 text-sm hover:bg-primary-50 transition-colors disabled:opacity-40"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={submitInvoiceRequest}
                      disabled={requestSending || !requestForm.razonSocial.trim() || !requestForm.nif.trim() || !requestForm.email.trim()}
                      className="px-5 py-2.5 bg-primary-900 text-white text-sm font-medium hover:bg-primary-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {requestSending ? (
                        <><Loader size={15} className="animate-spin" />Enviando…</>
                      ) : (
                        <><Send size={15} />Solicitar factura</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
