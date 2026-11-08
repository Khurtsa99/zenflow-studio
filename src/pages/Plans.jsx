import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatMNT } from '../lib/format'
import Icon from '../components/Icon'
import Spinner from '../components/Spinner'
import ErrorBox from '../components/ErrorBox'
import EmptyState from '../components/EmptyState'

export default function Plans() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [buyingId, setBuyingId] = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.from('membership_plans').select('*').eq('is_active', true).order('price')
    if (err) setError(err.message)
    else setPlans(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function buy(plan) {
    if (!session) {
      toast('Эхлээд нэвтэрнэ үү')
      return navigate('/login', { state: { from: location } })
    }
    setBuyingId(plan.id)
    // Edge Function нь гишүүнчлэл ба төлбөрийг pending төлөвтэй үүсгээд checkout холбоос буцаана
    const { data, error: err } = await supabase.functions.invoke('create-checkout', { body: { plan_id: plan.id } })
    if (err || data?.error || !data?.url) {
      setBuyingId(null)
      return toast.error(data?.error || 'Төлбөрийн хуудас нээхэд алдаа гарлаа. Дахин оролдоно уу.')
    }
    window.location.href = data.url
  }

  const featuredIdx = plans.length === 3 ? 1 : -1

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold text-ink-900 sm:text-4xl">Гишүүнчлэлийн багц</h1>
      <p className="mt-3 max-w-lg text-ink-600">Багцаа онлайнаар төлөөд шууд идэвхжүүл. Дараа нь хүссэн ангидаа бүртгүүл.</p>

      <div className="mt-10">
        {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={load} /> : plans.length === 0 ? (
          <EmptyState title="Багц байхгүй байна" text="Одоогоор худалдаалагдаж буй багц алга." />
        ) : (
          <div className="grid items-stretch gap-5 md:grid-cols-3">
            {plans.map((p, i) => {
              const featured = i === featuredIdx
              const perClass = p.class_limit ? Math.round(Number(p.price) / p.class_limit) : null
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -8 }} transition={{ type: 'spring', stiffness: 260, damping: 24, delay: i * 0.08 }} className={`flex flex-col rounded-4xl p-7 ${featured ? 'bg-ink-900 text-white md:-my-3 md:py-10' : 'border border-ink-100 bg-white text-ink-900'}`}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">{p.name}</h2>
                    {featured && <span className="badge bg-saffron text-ink-900">Түгээмэл</span>}
                  </div>
                  <p className={`mt-5 font-display text-3xl font-semibold ${featured ? 'text-white' : 'text-ink-900'}`}>{formatMNT(p.price)}</p>
                  <p className={`mt-1 text-sm ${featured ? 'text-ink-300' : 'text-ink-500'}`}>{p.duration_days} хоногийн турш</p>

                  <ul className={`mt-6 flex-1 space-y-3 text-sm ${featured ? 'text-ink-200' : 'text-ink-700'}`}>
                    <li className="flex items-start gap-2"><Icon name="check" size={18} className={featured ? 'text-saffron' : 'text-tenger-600'} /> {p.class_limit ? `${p.class_limit} анги` : 'Хязгааргүй анги'}</li>
                    {perClass && <li className="flex items-start gap-2"><Icon name="check" size={18} className="text-tenger-600" /> Нэг анги ойролцоогоор {formatMNT(perClass)}</li>}
                    <li className="flex items-start gap-2"><Icon name="check" size={18} className={featured ? 'text-saffron' : 'text-tenger-600'} /> QR кодоор ирц бүртгэнэ</li>
                    <li className="flex items-start gap-2"><Icon name="check" size={18} className={featured ? 'text-saffron' : 'text-tenger-600'} /> Бүртгэлээ хүссэн үедээ цуцална</li>
                  </ul>

                  <button className={`mt-8 w-full py-3 ${featured ? 'btn-saffron' : 'btn-primary'}`} disabled={buyingId !== null} onClick={() => buy(p)}>
                    {buyingId === p.id ? 'Төлбөрийн хуудас нээж байна...' : 'Худалдан авах'}
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <p className="mt-10 text-center text-sm text-ink-500">Туршилтын орчин: Stripe карт 4242 4242 4242 4242, ирээдүйн дурын огноо, дурын CVC.</p>
    </div>
  )
}
