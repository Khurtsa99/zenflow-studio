import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { supabase } from '../../lib/supabase'
import { PAYMENT_STATUS, formatDateTime, formatMNT } from '../../lib/format'
import Spinner from '../../components/Spinner'
import ErrorBox from '../../components/ErrorBox'

function Stat({ label, value, hint, dark = false, className = '' }) {
  return (
    <div className={`rounded-3xl p-5 ${dark ? 'bg-ink-900 text-white' : 'border border-ink-100 bg-white text-ink-900'} ${className}`}>
      <p className={`text-sm font-semibold ${dark ? 'text-ink-300' : 'text-ink-500'}`}>{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold sm:text-3xl">{value}</p>
      {hint && <p className={`mt-1 text-xs ${dark ? 'text-ink-400' : 'text-ink-400'}`}>{hint}</p>}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  async function load() {
    setError('')
    setData(null)
    const today = new Date().toISOString().slice(0, 10)
    const [pay, users, mem, book] = await Promise.all([
      supabase.from('payments').select('id, amount, status, paid_at, created_at, profiles(full_name), memberships(membership_plans(name))').order('created_at', { ascending: false }).limit(1000),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('status', 'active').gte('end_date', today),
      supabase.from('bookings').select('id, status, created_at, classes(class_types(name))').order('created_at', { ascending: false }).limit(1000),
    ])
    const err = pay.error || users.error || mem.error || book.error
    if (err) return setError(err.message)
    setData({ payments: pay.data, users: users.count ?? 0, activeMemberships: mem.count ?? 0, bookings: book.data })
  }

  useEffect(() => { load() }, [])

  const stats = useMemo(() => {
    if (!data) return null
    const paid = data.payments.filter((p) => p.status === 'paid')
    const revenue = paid.reduce((s, p) => s + Number(p.amount), 0)

    // Сүүлийн 6 сарын орлого
    const months = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: `${d.getMonth() + 1}-р сар`, revenue: 0 })
    }
    paid.forEach((p) => {
      const k = (p.paid_at || p.created_at).slice(0, 7)
      const m = months.find((x) => x.key === k)
      if (m) m.revenue += Number(p.amount)
    })

    // Ангийн төрлөөр захиалгын тоо
    const byType = {}
    const since = Date.now() - 30 * 86400000
    let recent = 0
    data.bookings.forEach((b) => {
      if (b.status === 'cancelled') return
      const name = b.classes?.class_types?.name || 'Бусад'
      byType[name] = (byType[name] || 0) + 1
      if (new Date(b.created_at).getTime() >= since) recent++
    })
    const typeData = Object.entries(byType).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8)

    return { revenue, months, typeData, recent, paidCount: paid.length }
  }, [data])

  if (error) return <ErrorBox message={error} onRetry={load} />
  if (!data || !stats) return <Spinner />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat dark className="col-span-2" label="Нийт орлого" value={formatMNT(stats.revenue)} hint={`${stats.paidCount} төлбөр`} />
        <Stat label="Нийт хэрэглэгч" value={data.users} />
        <Stat label="Идэвхтэй гишүүнчлэл" value={data.activeMemberships} />
        <Stat label="Сүүлийн 30 хоногийн захиалга" value={stats.recent} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-4 font-semibold">Сарын орлого (₮)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.months}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" fontSize={12} />
                <YAxis fontSize={12} width={70} tickFormatter={(v) => `${v / 1000}к`} />
                <Tooltip formatter={(v) => formatMNT(v)} />
                <Bar dataKey="revenue" name="Орлого" fill="#1D5BD8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 font-semibold">Ангийн төрлөөр захиалга</h3>
          {stats.typeData.length === 0 ? (
            <p className="py-16 text-center text-sm text-ink-500">Захиалга хараахан алга байна</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.typeData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" fontSize={12} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" fontSize={12} width={100} />
                  <Tooltip />
                  <Bar dataKey="count" name="Захиалга" fill="#F4B63F" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h3 className="px-5 pt-5 font-semibold">Сүүлийн төлбөрүүд</h3>
        {data.payments.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-500">Төлбөр хараахан алга байна</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead className="border-y border-ink-200 bg-ink-50 text-xs uppercase text-ink-500">
              <tr><th className="px-5 py-3">Хэрэглэгч</th><th className="px-5 py-3">Багц</th><th className="px-5 py-3">Дүн</th><th className="px-5 py-3">Төлөв</th><th className="px-5 py-3">Огноо</th></tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {data.payments.slice(0, 8).map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3">{p.profiles?.full_name || '-'}</td>
                  <td className="px-5 py-3">{p.memberships?.membership_plans?.name}</td>
                  <td className="px-5 py-3">{formatMNT(p.amount)}</td>
                  <td className="px-5 py-3"><span className={`badge ${PAYMENT_STATUS[p.status].cls}`}>{PAYMENT_STATUS[p.status].label}</span></td>
                  <td className="px-5 py-3">{formatDateTime(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
