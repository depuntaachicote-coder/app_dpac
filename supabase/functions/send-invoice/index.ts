import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const COMPANY = {
  name: 'GRUPO NORAN HOMES S.L.',
  brand: 'De Punta a Chicote',
  address: 'Av. Orense, 47, 4ºC',
  city: '36900 Marín, Pontevedra',
  email: 'hola@depuntaachicote.com',
  cif: 'B27619410',
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

function parseFiscalData(notes: string | null) {
  if (!notes || !notes.includes('[FACTURA_SOLICITADA]')) return null
  const tag = '[FACTURA_SOLICITADA]'
  const start = notes.indexOf(tag) + tag.length
  const rest = notes.slice(start)
  const end = rest.search(/\[FACTURA_/)
  const block = end >= 0 ? rest.slice(0, end) : rest
  const lines = block.split('\n').map((l: string) => l.trim()).filter(Boolean)
  const get = (prefix: string) => {
    const line = lines.find((l: string) => l.startsWith(prefix))
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

function buildInvoiceHtml(
  invoice: Record<string, any>,
  fiscal: { razonSocial: string; nif: string; direccion: string; cpCiudad: string; email: string },
  clientName: string
) {
  const items = invoice.items as Array<{ description: string; quantity: number; price: number }>
  const rows = items
    .map(
      (item) => `
    <tr>
      <td>${item.description}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">${fmt(item.price)}</td>
      <td style="text-align:right">${fmt(item.quantity * item.price)}</td>
    </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Factura ${invoice.invoice_number} — De Punta a Chicote</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Helvetica Neue',Arial,sans-serif;color:#111827;padding:48px;max-width:800px;margin:0 auto}
  header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:48px;padding-bottom:32px;border-bottom:2px solid #0f172a}
  .brand{font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.5px}
  .legal{font-size:11px;color:#64748b;margin-top:2px;font-weight:600;letter-spacing:0.03em}
  .address{margin-top:12px;font-size:12.5px;color:#475569;line-height:1.8}
  .inv-meta{text-align:right}
  .inv-label{font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;margin-bottom:4px}
  .inv-number{font-size:22px;font-weight:800;color:#0f172a}
  .inv-date{font-size:12px;color:#64748b;margin-top:8px;line-height:1.7}
  .parties{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-bottom:36px}
  .party-label{font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;margin-bottom:8px;font-weight:600}
  .party-name{font-size:14px;font-weight:700;color:#0f172a}
  .party-info{font-size:12.5px;color:#475569;line-height:1.7;margin-top:4px}
  table{width:100%;border-collapse:collapse}
  th{background:#0f172a;color:#fff;padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:600}
  td{padding:12px 14px;border-bottom:1px solid #e2e8f0;font-size:13.5px;color:#1e293b}
  tr:last-child td{border-bottom:none}
  tr:nth-child(even) td{background:#f8fafc}
  .totals-wrap{display:flex;justify-content:flex-end;border-top:2px solid #e2e8f0}
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
  <div class="inv-meta">
    <div class="inv-label">Factura</div>
    <div class="inv-number">${invoice.invoice_number}</div>
    <div class="inv-date">
      Fecha: ${fmtDate(invoice.created_at)}<br>
      ${invoice.paid_at ? `Pagado: ${fmtDate(invoice.paid_at)}` : ''}
    </div>
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
    <div class="party-name">${fiscal.razonSocial || clientName || 'Cliente'}</div>
    <div class="party-info">
      NIF/CIF: ${fiscal.nif}<br>
      ${fiscal.direccion ? `${fiscal.direccion}<br>` : ''}
      ${fiscal.cpCiudad ? `${fiscal.cpCiudad}<br>` : ''}
      ${fiscal.email}
    </div>
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
    <div class="totals-row"><span>Base imponible</span><span>${fmt(invoice.subtotal)}</span></div>
    <div class="totals-row"><span>IVA (${invoice.tax_rate}%)</span><span>${fmt(invoice.tax_amount)}</span></div>
    <div class="totals-divider"></div>
    <div class="totals-total"><span>Total</span><span>${fmt(invoice.total)}</span></div>
  </div>
</div>
<div class="footer">
  Factura emitida por ${COMPANY.name} · CIF ${COMPANY.cif}<br>
  ${COMPANY.address} · ${COMPANY.city} · ${COMPANY.email}
</div>
</body>
</html>`
}

function buildEmailHtml(invoiceNumber: string, clientName: string) {
  const greeting = clientName ? clientName.split(' ')[0] : 'Estimado/a cliente'
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;max-width:600px;width:100%;">
        <tr>
          <td style="background:#1a1a1a;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-family:Georgia,serif;font-size:22px;letter-spacing:4px;text-transform:uppercase;">
              DE PUNTA A CHICOTE
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 16px;color:#1a1a1a;font-size:16px;line-height:1.6;">${greeting},</p>
            <p style="margin:0 0 24px;color:#444;font-size:15px;line-height:1.7;">
              Adjunto encontrarás tu factura <strong>${invoiceNumber}</strong> emitida por
              <strong>De Punta a Chicote</strong> (GRUPO NORAN HOMES S.L.). El documento incluye
              el desglose de IVA y sirve como justificante fiscal de tu compra.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr>
                <td style="background:#1a1a1a;padding:14px 28px;">
                  <a href="https://depuntaachicote.com/dashboard/facturas"
                     style="color:#ffffff;text-decoration:none;font-size:14px;font-family:Georgia,serif;letter-spacing:1px;text-transform:uppercase;">
                    Ver mis facturas
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0;color:#888;font-size:13px;line-height:1.6;">
              Si tienes cualquier duda, responde a este correo y te atenderemos encantados.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f5f5f0;padding:24px 40px;border-top:1px solid #e8e8e0;">
            <p style="margin:0;color:#888;font-size:12px;text-align:center;letter-spacing:1px;">
              DE PUNTA A CHICOTE · ${COMPANY.email}
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'No autorizado' }, 401)

    // Verify caller is a valid user
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return json({ error: 'No autorizado' }, 401)

    // Use service role for DB operations
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Check admin role
    const { data: adminProfile } = await adminClient
      .from('profiles')
      .select('user_type, role')
      .eq('id', user.id)
      .single()

    if (adminProfile?.user_type !== 'admin' && adminProfile?.role !== 'admin') {
      return json({ error: 'Acceso solo para administradores' }, 403)
    }

    const { invoiceId } = await req.json()
    if (!invoiceId) return json({ error: 'invoiceId requerido' }, 400)

    // Fetch invoice
    const { data: invoice, error: invError } = await adminClient
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (invError || !invoice) return json({ error: 'Factura no encontrada' }, 404)

    // Parse fiscal data from notes
    const fiscal = parseFiscalData(invoice.notes)
    if (!fiscal) return json({ error: 'No hay datos fiscales en esta solicitud' }, 400)

    // Fetch client profile
    const { data: clientProfile } = await adminClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', invoice.user_id)
      .single()

    const clientName = clientProfile?.full_name || ''
    const recipientEmail = fiscal.email || clientProfile?.email || ''
    if (!recipientEmail) return json({ error: 'Sin email de destino' }, 400)

    // Generate invoice HTML
    const invoiceHtml = buildInvoiceHtml(invoice, fiscal, clientName)

    // Build notification email HTML
    const emailHtml = buildEmailHtml(invoice.invoice_number, clientName)

    // Send via send-email edge function (pass admin's own JWT so it authenticates correctly)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const sendEmailRes = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: recipientEmail,
        subject: `Tu factura ${invoice.invoice_number} — De Punta a Chicote`,
        html: emailHtml,
        text: `Hola ${clientName || ''},\n\nAdjunto tu factura ${invoice.invoice_number} de De Punta a Chicote.\nAccede a tus documentos en: https://depuntaachicote.com/dashboard/facturas\n\nUn saludo,\nEl equipo de De Punta a Chicote\n${COMPANY.email}`,
      }),
    })

    const emailResult = await sendEmailRes.json().catch(() => ({}))
    if (!sendEmailRes.ok || emailResult?.error) {
      const errMsg = emailResult?.error || `HTTP ${sendEmailRes.status}`
      console.error('send-email error:', errMsg)
      return json({ error: `Error al enviar email: ${errMsg}` }, 500)
    }

    // Mark as sent: replace [FACTURA_SOLICITADA] with [FACTURA_ENVIADA:timestamp]
    const sentTag = `[FACTURA_ENVIADA:${new Date().toISOString()}]`
    const updatedNotes = (invoice.notes || '').replace('[FACTURA_SOLICITADA]', sentTag)
    await adminClient.from('invoices').update({ notes: updatedNotes } as never).eq('id', invoiceId)

    return json({ ok: true, sentTo: recipientEmail })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('send-invoice error:', message)
    return json({ error: message }, 500)
  }
})
