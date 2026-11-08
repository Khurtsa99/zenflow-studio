// Edge Function: stripe-webhook
// Stripe төлбөр амжилттай болоход дуудагдаж payments -> "paid", memberships -> "active" болгоно.
// Deploy: supabase functions deploy stripe-webhook --no-verify-jwt
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=denonext'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { httpClient: Stripe.createFetchHttpClient() })

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) return new Response('Signature алга', { status: 400 })

  const body = await req.text()
  let event: Stripe.Event
  try {
    // Stripe-аас ирсэн хүсэлт мөн эсэхийг гарын үсгээр шалгана
    event = await stripe.webhooks.constructEventAsync(
      body, signature, Deno.env.get('STRIPE_WEBHOOK_SECRET')!, undefined, Stripe.createSubtleCryptoProvider(),
    )
  } catch (err) {
    console.error('Signature алдаа', err)
    return new Response('Invalid signature', { status: 400 })
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const paymentId = Number(session.metadata?.payment_id)

      if (session.payment_status === 'paid' && paymentId) {
        const { data: payment } = await admin
          .from('payments')
          .select('id, status, membership_id, memberships(id, membership_plans(duration_days))')
          .eq('id', paymentId)
          .maybeSingle()

        // Idempotent: webhook давхар ирсэн ч нэг л удаа идэвхжүүлнэ
        if (payment && payment.status !== 'paid') {
          const days = (payment as any).memberships?.membership_plans?.duration_days ?? 30
          const start = new Date()
          const end = new Date(start.getTime() + days * 86400000)
          const fmt = (d: Date) => d.toISOString().slice(0, 10)

          await admin.from('payments').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', payment.id)
          await admin.from('memberships')
            .update({ status: 'active', start_date: fmt(start), end_date: fmt(end) })
            .eq('id', payment.membership_id)
        }
      }
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session
      const paymentId = Number(session.metadata?.payment_id)
      if (paymentId) {
        await admin.from('payments').update({ status: 'failed' }).eq('id', paymentId).eq('status', 'pending')
      }
    }
  } catch (e) {
    console.error(e)
    return new Response('Server error', { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
})
