// Edge Function: create-checkout
// Нэвтэрсэн хэрэглэгчийн сонгосон багцаар memberships + payments (pending) үүсгээд
// Stripe Checkout холбоос буцаана. service_role түлхүүр зөвхөн ЭНД (сервер талд) ашиглагдана.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=denonext'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Нэвтрээгүй байна' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    // 1) JWT-ээр хэрэглэгчийг баталгаажуулна
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return json({ error: 'Нэвтрээгүй байна' }, 401)

    const { plan_id } = await req.json()
    if (!plan_id) return json({ error: 'plan_id шаардлагатай' }, 400)

    // 2) service_role-оор бичилт хийнэ (RLS-ийг тойрно)
    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: plan } = await admin.from('membership_plans').select('*').eq('id', plan_id).eq('is_active', true).maybeSingle()
    if (!plan) return json({ error: 'Багц олдсонгүй' }, 404)

    const { data: membership, error: mErr } = await admin
      .from('memberships').insert({ user_id: user.id, plan_id: plan.id, status: 'pending' }).select().single()
    if (mErr) throw mErr

    const { data: payment, error: pErr } = await admin
      .from('payments')
      .insert({ user_id: user.id, membership_id: membership.id, amount: plan.price, status: 'pending', provider: 'stripe' })
      .select().single()
    if (pErr) throw pErr

    // 3) Stripe Checkout. Stripe MNT-ийг дэмждэггүй тул туршилтын орчинд USD-ээр хөрвүүлнэ.
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { httpClient: Stripe.createFetchHttpClient() })
    const rate = Number(Deno.env.get('MNT_PER_USD') ?? '3400')
    const site = Deno.env.get('SITE_URL') ?? req.headers.get('origin') ?? ''

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email ?? undefined,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: Math.max(50, Math.round((Number(plan.price) / rate) * 100)),
          product_data: { name: `ZenFlow · ${plan.name}` },
        },
      }],
      metadata: { payment_id: String(payment.id) },
      success_url: `${site}/payment/success?payment_id=${payment.id}`,
      cancel_url: `${site}/plans`,
    })

    await admin.from('payments').update({ provider_ref: session.id }).eq('id', payment.id)
    return json({ url: session.url })
  } catch (e) {
    console.error(e)
    return json({ error: 'Серверийн алдаа гарлаа' }, 500)
  }
})
