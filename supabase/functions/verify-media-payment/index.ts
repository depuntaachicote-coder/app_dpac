import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const IVA_RATE = 21

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

    const { sessionId } = await req.json()
    if (!sessionId) return json({ error: 'sessionId requerido' }, 400)

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2025-03-31.basil' as any,
    })

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'total_details'],
    })

    if (session.payment_status !== 'paid') {
      return json({ ok: false, error: 'Pago no completado' }, 402)
    }

    if (session.metadata?.user_id !== user.id) {
      return json({ error: 'No autorizado' }, 403)
    }

    const mediaIds = (session.metadata?.media_ids ?? '').split(',').filter(Boolean)
    if (!mediaIds.length) return json({ ok: false, error: 'Sin archivos en la sesión' }, 400)

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── 1. Register purchases (idempotent) ───────────────────────────────────
    const amountTotal = (session.amount_total ?? 0) / 100
    const amountPerFile = amountTotal / mediaIds.length

    const inserts = mediaIds.map((mediaId: string) => ({
      user_id: user.id,
      media_id: mediaId,
      stripe_session_id: sessionId,
      amount_paid: amountPerFile,
    }))
    await adminClient.from('media_purchases').upsert(inserts, { onConflict: 'user_id,media_id' })

    // ── 2. Mark files available ───────────────────────────────────────────────
    await adminClient
      .from('media')
      .update({ is_available: true } as never)
      .in('id', mediaIds)

    // ── 3. Fetch purchased media details ─────────────────────────────────────
    const { data: purchasedMedia } = await adminClient
      .from('media')
      .select('*')
      .in('id', mediaIds)

    // ── 4. Generate receipt (skip if already exists for this session) ────────
    const receiptSessionTag = `stripe:${sessionId}`
    const { data: existingReceipt } = await adminClient
      .from('invoices')
      .select('id, invoice_number')
      .eq('description', receiptSessionTag)
      .maybeSingle()

    let receiptNumber: string | null = null

    if (!existingReceipt) {
      // Price breakdown
      const amountSubtotal = (session.amount_subtotal ?? session.amount_total ?? 0) / 100
      const stripeTax = (session.total_details as any)?.amount_tax ?? 0
      const taxAmount = stripeTax > 0
        ? stripeTax / 100
        : Math.round(amountSubtotal * (IVA_RATE / 100) * 100) / 100
      const subtotal = amountSubtotal
      const total = subtotal + taxAmount
      const pricePerFile = subtotal / mediaIds.length

      // Build line items grouped by type
      const mediaDetails = (purchasedMedia ?? []) as Array<{ file_type: string; file_name: string }>
      const imageCount = mediaDetails.filter(m => m.file_type === 'image').length
      const videoCount = mediaDetails.filter(m => m.file_type === 'video').length
      const items: Array<{ description: string; quantity: number; price: number }> = []
      if (imageCount > 0) items.push({ description: 'Fotografía profesional', quantity: imageCount, price: pricePerFile })
      if (videoCount > 0) items.push({ description: 'Vídeo profesional', quantity: videoCount, price: pricePerFile })
      if (items.length === 0) items.push({ description: 'Archivo multimedia', quantity: mediaIds.length, price: pricePerFile })

      // Receipt number: DPAC-YYYYMM-{last 6 of session}
      const now = new Date()
      const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
      receiptNumber = `DPAC-${ym}-${sessionId.slice(-6).toUpperCase()}`

      await adminClient.from('invoices').insert({
        user_id: user.id,
        invoice_number: receiptNumber,
        title: `Compra de archivos multimedia · ${mediaIds.length} archivo${mediaIds.length !== 1 ? 's' : ''}`,
        description: receiptSessionTag,
        items: items as unknown,
        subtotal,
        tax_rate: IVA_RATE,
        tax_amount: taxAmount,
        total,
        status: 'paid',
        paid_at: new Date().toISOString(),
        notes: `Sesión Stripe: ${sessionId}`,
      } as never)
    } else {
      receiptNumber = existingReceipt.invoice_number
    }

    return json({ ok: true, mediaIds, media: purchasedMedia ?? [], receiptNumber })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('verify-media-payment error:', message)
    return json({ error: message }, 500)
  }
})
