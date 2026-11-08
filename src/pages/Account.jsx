import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { MEMBERSHIP_STATUS, PAYMENT_STATUS, formatDate, formatDateTime, formatMNT, isPhone } from '../lib/format'
import Spinner from '../components/Spinner'
import ErrorBox from '../components/ErrorBox'
import EmptyState from '../components/EmptyState'

export default function Account() {
  const { user, profile, refreshProfile } = useAuth()
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [memberships, setMemberships] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name || '', phone: profile.phone || '' })
  }, [profile])

  async function load() {
    setLoading(true)
    setError('')
    const [m, p] = await Promise.all([
      supabase.from('memberships').select('*, membership_plans(name, price, class_limit)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('payments').select('*, memberships(membership_plans(name))').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    if (m.error || p.error) setError((m.error || p.error).message)
    else { setMemberships(m.data); setPayments(p.data) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function saveProfile(e) {
    e.preventDefault()
    const errs = {}
    if (form.full_name.trim().length < 2) errs.full_name = 'Нэрээ оруулна уу'
    if (form.phone.trim() && !isPhone(form.phone.trim())) errs.phone = 'Утасны дугаар буруу байна'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    const { error: err } = await supabase.from('profiles').update({ full_name: form.full_name.trim(), phone: form.phone.trim() || null }).eq('id', user.id)
    setSaving(false)
    if (err) return toast.error(err.message)
    toast.success('Мэдээлэл хадгалагдлаа')
    refreshProfile()
  }

  // Хугацаа дууссан эсэхийг end_date-ээр тодорхойлно
  const today = new Date().toISOString().slice(0, 10)
  const effectiveStatus = (m) => (m.status === 'active' && m.end_date < today ? 'expired' : m.status)

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <h1 className="font-display text-3xl font-semibold">Миний данс</h1>

      <form onSubmit={saveProfile} className="card space-y-4 p-6" noValidate>
        <h2 className="text-lg font-semibold">Хувийн мэдээлэл</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="full_name">Овог нэр</label>
            <input id="full_name" className={`input ${errors.full_name ? 'input-error' : ''}`} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name}</p>}
          </div>
          <div>
            <label className="label" htmlFor="phone">Утас</label>
            <input id="phone" className={`input ${errors.phone ? 'input-error' : ''}`} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="99112233" />
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="label">Имэйл</label>
            <input className="input bg-ink-100" value={user.email} disabled />
          </div>
        </div>
        <button className="btn-primary" disabled={saving}>{saving ? 'Хадгалж байна...' : 'Хадгалах'}</button>
      </form>

      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={load} /> : (
        <>
          <section>
            <h2 className="mb-3 text-lg font-semibold">Миний гишүүнчлэл</h2>
            {memberships.length === 0 ? (
              <EmptyState title="Гишүүнчлэл байхгүй байна" text="Багц худалдан аваад ангид бүртгүүлээрэй." action={<Link to="/plans" className="btn-primary">Багц харах</Link>} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {memberships.map((m) => {
                  const st = MEMBERSHIP_STATUS[effectiveStatus(m)]
                  return (
                    <div key={m.id} className="card p-5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{m.membership_plans?.name}</h3>
                        <span className={`badge ${st.cls}`}>{st.label}</span>
                      </div>
                      <p className="mt-2 text-sm text-ink-600">
                        {m.start_date ? `${formatDate(m.start_date)} - ${formatDate(m.end_date)}` : 'Төлбөр хүлээгдэж байна'}
                      </p>
                      <p className="text-sm text-ink-500">{m.membership_plans?.class_limit ? `${m.membership_plans.class_limit} анги` : 'Хязгааргүй анги'}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">Төлбөрийн түүх</h2>
            {payments.length === 0 ? (
              <EmptyState title="Төлбөр байхгүй байна" />
            ) : (
              <div className="card overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-ink-200 bg-ink-50 text-xs uppercase text-ink-500">
                    <tr><th className="px-4 py-3">Багц</th><th className="px-4 py-3">Дүн</th><th className="px-4 py-3">Төлөв</th><th className="px-4 py-3">Огноо</th></tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-3">{p.memberships?.membership_plans?.name}</td>
                        <td className="px-4 py-3">{formatMNT(p.amount)}</td>
                        <td className="px-4 py-3"><span className={`badge ${PAYMENT_STATUS[p.status].cls}`}>{PAYMENT_STATUS[p.status].label}</span></td>
                        <td className="px-4 py-3">{formatDateTime(p.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
