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

// ── Formatters ────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

// ── UTF-8 safe base64 encode ──────────────────────────────────────────────────
function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

// ── Parse fiscal data from invoices.notes ────────────────────────────────────
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

// ── Build printable invoice HTML (sent as PDF attachment) ────────────────────
function buildInvoicePrintHtml(
  invoice: Record<string, any>,
  fiscal: { razonSocial: string; nif: string; direccion: string; cpCiudad: string; email: string },
  clientName: string
): string {
  const items = invoice.items as Array<{ description: string; quantity: number; price: number }>
  const rows = items
    .map(
      (item) => `
    <tr>
      <td style="padding:11px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b">${item.description}</td>
      <td style="padding:11px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b;text-align:center">${item.quantity}</td>
      <td style="padding:11px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b;text-align:right">${fmt(item.price)}</td>
      <td style="padding:11px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#0f172a;text-align:right">${fmt(item.quantity * item.price)}</td>
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
  @media print{body{padding:20px}@page{margin:1cm;size:A4}}
</style>
</head>
<body>
<!-- Header -->
<table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:2px solid #0f172a;padding-bottom:28px;margin-bottom:36px">
  <tr>
    <td valign="top">
      <div style="font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.5px">De Punta a Chicote</div>
      <div style="font-size:11px;color:#64748b;font-weight:600;letter-spacing:0.04em;margin-top:2px">${COMPANY.name}</div>
      <div style="margin-top:10px;font-size:12.5px;color:#475569;line-height:1.8">
        ${COMPANY.address}<br>
        ${COMPANY.city}<br>
        ${COMPANY.email}<br>
        CIF: ${COMPANY.cif}
      </div>
    </td>
    <td valign="top" align="right">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;margin-bottom:4px">Factura</div>
      <div style="font-size:22px;font-weight:800;color:#0f172a">${invoice.invoice_number}</div>
      <div style="font-size:12px;color:#64748b;margin-top:8px;line-height:1.7">
        Fecha: ${fmtDate(invoice.created_at)}<br>
        ${invoice.paid_at ? `Pagado: ${fmtDate(invoice.paid_at)}` : ''}
      </div>
    </td>
  </tr>
</table>

<!-- Parties -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
  <tr>
    <td width="50%" valign="top">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;font-weight:600;margin-bottom:8px">Emisor</div>
      <div style="font-size:13px;font-weight:700;color:#0f172a">${COMPANY.name}</div>
      <div style="font-size:12.5px;color:#475569;margin-top:4px;line-height:1.7">
        ${COMPANY.brand}<br>${COMPANY.address}<br>${COMPANY.city}<br>CIF: ${COMPANY.cif}
      </div>
    </td>
    <td width="50%" valign="top" style="padding-left:32px">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;font-weight:600;margin-bottom:8px">Cliente</div>
      <div style="font-size:13px;font-weight:700;color:#0f172a">${fiscal.razonSocial || clientName || 'Cliente'}</div>
      <div style="font-size:12.5px;color:#475569;margin-top:4px;line-height:1.7">
        NIF/CIF: ${fiscal.nif}<br>
        ${fiscal.direccion ? `${fiscal.direccion}<br>` : ''}
        ${fiscal.cpCiudad ? `${fiscal.cpCiudad}<br>` : ''}
        ${fiscal.email}
      </div>
    </td>
  </tr>
</table>

<!-- Line items -->
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:0">
  <thead>
    <tr style="background:#0f172a">
      <th style="padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#fff;font-weight:600">Descripción</th>
      <th style="padding:10px 14px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#fff;font-weight:600">Cant.</th>
      <th style="padding:10px 14px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#fff;font-weight:600">Precio unit. (sin IVA)</th>
      <th style="padding:10px 14px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#fff;font-weight:600">Importe</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>

<!-- Totals -->
<table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #e2e8f0;margin-top:0">
  <tr>
    <td></td>
    <td width="280" style="padding-top:18px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#475569">Base imponible</td>
          <td style="padding:4px 0;font-size:13px;color:#475569;text-align:right">${fmt(invoice.subtotal)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#475569">IVA (${invoice.tax_rate}%)</td>
          <td style="padding:4px 0;font-size:13px;color:#475569;text-align:right">${fmt(invoice.tax_amount)}</td>
        </tr>
        <tr>
          <td colspan="2" style="border-top:2px solid #0f172a;padding-top:10px;margin-top:8px"></td>
        </tr>
        <tr>
          <td style="padding:6px 0 0;font-size:18px;font-weight:800;color:#0f172a">Total</td>
          <td style="padding:6px 0 0;font-size:18px;font-weight:800;color:#0f172a;text-align:right">${fmt(invoice.total)}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Footer -->
<div style="margin-top:48px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;line-height:1.6">
  Factura emitida por ${COMPANY.name} · CIF ${COMPANY.cif}<br>
  ${COMPANY.address} · ${COMPANY.city} · ${COMPANY.email}
</div>

<script>window.onload=function(){window.print()}<\/script>
</body>
</html>`
}

// ── Build email body HTML with full invoice embedded ─────────────────────────
function buildEmailHtml(
  invoice: Record<string, any>,
  fiscal: { razonSocial: string; nif: string; direccion: string; cpCiudad: string; email: string },
  clientName: string
): string {
  const greeting = clientName ? clientName.split(' ')[0] : 'Estimado/a cliente'
  const items = invoice.items as Array<{ description: string; quantity: number; price: number }>

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #e8e8e0;font-size:13px;color:#333">${item.description}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #e8e8e0;font-size:13px;color:#333;text-align:center">${item.quantity}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #e8e8e0;font-size:13px;color:#333;text-align:right">${fmt(item.price)}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #e8e8e0;font-size:13px;font-weight:600;color:#111;text-align:right">${fmt(item.quantity * item.price)}</td>
      </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;max-width:600px;width:100%;">

      <!-- Header brand -->
      <tr>
        <td style="background:#1a1a1a;padding:28px 40px;text-align:center;">
          <div style="color:#ffffff;font-family:Georgia,serif;font-size:20px;letter-spacing:4px;text-transform:uppercase;font-weight:bold;">
            DE PUNTA A CHICOTE
          </div>
        </td>
      </tr>

      <!-- Greeting -->
      <tr>
        <td style="padding:32px 40px 20px;">
          <p style="margin:0 0 12px;color:#1a1a1a;font-size:16px;line-height:1.5;">${greeting},</p>
          <p style="margin:0;color:#555;font-size:14px;line-height:1.7;">
            Se adjunta tu factura oficial <strong>${invoice.invoice_number}</strong> emitida por
            <strong>${COMPANY.name}</strong> (De Punta a Chicote).<br>
            El documento incluye el desglose de IVA y sirve como justificante fiscal.
          </p>
        </td>
      </tr>

      <!-- Invoice card -->
      <tr>
        <td style="padding:0 24px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0d8;">

            <!-- Invoice header -->
            <tr style="background:#f9f9f6">
              <td style="padding:20px 24px;border-bottom:1px solid #e0e0d8;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td valign="top">
                      <div style="font-size:16px;font-weight:bold;color:#111;font-family:Georgia,serif;">De Punta a Chicote</div>
                      <div style="font-size:11px;color:#666;font-weight:600;letter-spacing:0.04em;margin-top:2px">${COMPANY.name}</div>
                      <div style="font-size:12px;color:#666;margin-top:8px;line-height:1.7">
                        ${COMPANY.address}<br>${COMPANY.city}<br>CIF: ${COMPANY.cif}
                      </div>
                    </td>
                    <td valign="top" align="right">
                      <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#999;margin-bottom:3px">Factura</div>
                      <div style="font-size:18px;font-weight:bold;color:#111;font-family:Georgia,serif;">${invoice.invoice_number}</div>
                      <div style="font-size:12px;color:#666;margin-top:6px;line-height:1.7">
                        ${fmtDate(invoice.created_at)}<br>
                        ${invoice.paid_at ? `Pagado: ${fmtDate(invoice.paid_at)}` : ''}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Parties -->
            <tr>
              <td style="padding:16px 24px;border-bottom:1px solid #e0e0d8;background:#fff">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="50%" valign="top" style="padding-right:16px">
                      <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#999;font-weight:600;margin-bottom:6px">Emisor</div>
                      <div style="font-size:12px;font-weight:bold;color:#111">${COMPANY.name}</div>
                      <div style="font-size:12px;color:#555;margin-top:3px;line-height:1.6">${COMPANY.address}<br>${COMPANY.city}<br>CIF: ${COMPANY.cif}</div>
                    </td>
                    <td width="50%" valign="top" style="padding-left:16px;border-left:1px solid #e8e8e0">
                      <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#999;font-weight:600;margin-bottom:6px">Facturar a</div>
                      <div style="font-size:12px;font-weight:bold;color:#111">${fiscal.razonSocial || clientName || 'Cliente'}</div>
                      <div style="font-size:12px;color:#555;margin-top:3px;line-height:1.6">
                        NIF/CIF: ${fiscal.nif}<br>
                        ${fiscal.direccion ? `${fiscal.direccion}<br>` : ''}
                        ${fiscal.cpCiudad ? `${fiscal.cpCiudad}<br>` : ''}
                        ${fiscal.email}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Line items table -->
            <tr>
              <td style="padding:0;background:#fff">
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
                  <thead>
                    <tr style="background:#1a1a1a">
                      <th style="padding:9px 16px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:#fff;font-weight:600">Descripción</th>
                      <th style="padding:9px 16px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:#fff;font-weight:600">Cant.</th>
                      <th style="padding:9px 16px;text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:#fff;font-weight:600">Precio unit.</th>
                      <th style="padding:9px 16px;text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:#fff;font-weight:600">Importe</th>
                    </tr>
                  </thead>
                  <tbody>${itemRows}</tbody>
                </table>
              </td>
            </tr>

            <!-- Totals -->
            <tr>
              <td style="padding:16px 24px;background:#f9f9f6;border-top:1px solid #e0e0d8">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td></td>
                    <td width="220">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding:3px 0;font-size:12px;color:#666">Base imponible</td>
                          <td style="padding:3px 0;font-size:12px;color:#666;text-align:right">${fmt(invoice.subtotal)}</td>
                        </tr>
                        <tr>
                          <td style="padding:3px 0;font-size:12px;color:#666">IVA (${invoice.tax_rate}%)</td>
                          <td style="padding:3px 0;font-size:12px;color:#666;text-align:right">${fmt(invoice.tax_amount)}</td>
                        </tr>
                        <tr>
                          <td colspan="2" style="padding:6px 0 0"><div style="border-top:2px solid #1a1a1a"></div></td>
                        </tr>
                        <tr>
                          <td style="padding:6px 0 0;font-size:16px;font-weight:bold;color:#111;font-family:Georgia,serif">Total</td>
                          <td style="padding:6px 0 0;font-size:16px;font-weight:bold;color:#111;text-align:right;font-family:Georgia,serif">${fmt(invoice.total)}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
        </td>
      </tr>

      <!-- Action link -->
      <tr>
        <td style="padding:4px 40px 28px;text-align:center">
          <p style="margin:0 0 16px;font-size:13px;color:#777;line-height:1.6">
            Puedes acceder a tus facturas en cualquier momento desde tu panel de usuario.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 auto">
            <tr>
              <td style="background:#1a1a1a;padding:12px 24px">
                <a href="https://depuntaachicote.com/dashboard/facturas"
                   style="color:#ffffff;text-decoration:none;font-size:13px;font-family:Georgia,serif;letter-spacing:1px;text-transform:uppercase">
                  Ver mis facturas
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f5f5f0;padding:20px 40px;border-top:1px solid #e8e8e0">
          <p style="margin:0;color:#999;font-size:11px;text-align:center;letter-spacing:0.5px;line-height:1.6">
            ${COMPANY.name} · CIF ${COMPANY.cif}<br>
            ${COMPANY.address} · ${COMPANY.city} · ${COMPANY.email}
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ── Main handler ──────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'No autorizado' }, 401)

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return json({ error: 'No autorizado' }, 401)

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify admin
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

    // Parse fiscal data
    const fiscal = parseFiscalData(invoice.notes)
    if (!fiscal) return json({ error: 'No hay datos fiscales en esta solicitud. El cliente debe rellenar el formulario de solicitud de factura primero.' }, 400)

    // Fetch client profile
    const { data: clientProfile } = await adminClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', invoice.user_id)
      .single()

    const clientName = clientProfile?.full_name || ''
    const recipientEmail = fiscal.email || clientProfile?.email || ''
    if (!recipientEmail) return json({ error: 'Sin email de destino' }, 400)

    // Fetch email settings
    const { data: emailSettings } = await adminClient
      .from('email_settings')
      .select('*')
      .eq('is_active', true)
      .maybeSingle()

    // Build content
    const emailHtml = buildEmailHtml(invoice, fiscal, clientName)
    const pdfHtml = buildInvoicePrintHtml(invoice, fiscal, clientName)
    const pdfBase64 = toBase64(pdfHtml)
    const subject = `Factura ${invoice.invoice_number} — De Punta a Chicote`
    const textBody = `${clientName ? clientName.split(' ')[0] : 'Estimado/a cliente'},\n\nAdjunto tu factura ${invoice.invoice_number} de ${COMPANY.name} (De Punta a Chicote).\n\nBase imponible: ${fmt(invoice.subtotal)}\nIVA (${invoice.tax_rate}%): ${fmt(invoice.tax_amount)}\nTotal: ${fmt(invoice.total)}\n\nAccede a tus facturas en: https://depuntaachicote.com/dashboard/facturas\n\nUn saludo,\nEl equipo de De Punta a Chicote\n${COMPANY.email}`

    let sentOk = false

    // ── Try Resend with PDF attachment ───────────────────────────────────────
    if (emailSettings?.provider === 'resend' && emailSettings?.api_key) {
      const fromField = `${emailSettings.from_name || 'De Punta a Chicote'} <${emailSettings.from_email}>`
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${emailSettings.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromField,
          to: [recipientEmail],
          subject,
          html: emailHtml,
          text: textBody,
          attachments: [
            {
              filename: `factura_${invoice.invoice_number}.html`,
              content: pdfBase64,
            },
          ],
        }),
      })
      if (resendRes.ok) {
        sentOk = true
      } else {
        const errData = await resendRes.json().catch(() => ({}))
        console.error('Resend error:', errData)
      }
    }

    // ── Fallback: send-email function (no attachment support, but sends email) ─
    if (!sentOk) {
      const sendRes = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`,
        {
          method: 'POST',
          headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: recipientEmail, subject, html: emailHtml, text: textBody }),
        }
      )
      const sendData = await sendRes.json().catch(() => ({}))
      if (!sendRes.ok || sendData?.error) {
        const errMsg = sendData?.error || `HTTP ${sendRes.status}`
        return json({ error: `Error al enviar el email: ${errMsg}` }, 500)
      }
      sentOk = true
    }

    // ── Mark as sent ─────────────────────────────────────────────────────────
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
