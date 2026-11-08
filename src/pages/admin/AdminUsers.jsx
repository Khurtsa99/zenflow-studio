import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { formatDate, formatMNT } from '../../lib/format'
import Spinner from '../../components/Spinner'
import ErrorBox from '../../components/ErrorBox'
import EmptyState from '../../components/EmptyState'
import Pagination from '../../components/Pagination'
import ConfirmDialog from '../../components/ConfirmDialog'
import Modal from '../../components/Modal'

const PAGE_SIZE = 10
const METHODS = [
  { value: 'cash', label: 'Бэлнээр' },
  { value: 'transfer', label: 'Дансаар шилжүүлсэн' },
]

export default function AdminUsers() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(null) // {id, name, role}
  const [saving, setSaving] = useState(false)

  // Багц олгох (студид бэлнээр эсвэл шилжүүлгээр төлсөн гишүүнд)
  const [plans, setPlans] = useState([])
  const [grant, setGrant] = useState(null) // {id, name}
  const [planId, setPlanId] = useState('')
  const [method, setMethod] = useState('cash')
  const [granting, setGranting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    let q = supabase.from('profiles').select('*', { count: 'exact' })
    if (search) q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    const { data, error: err, count } = await q.order('created_at', { ascending: false }).range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
    if (err) setError(err.message)
    else { setRows(data); setTotal(count ?? 0) }
    setLoading(false)
  }, [page, search])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    supabase.from('membership_plans').select('*').eq('is_active', true).order('price').then(({ data }) => setPlans(data || []))
  }, [])

  async function changeRole() {
    setSaving(true)
    const { error: err } = await supabase.from('profiles').update({ role: pending.role }).eq('id', pending.id)
    setSaving(false)
    if (err) return toast.error(err.message)
    toast.success('Эрх шинэчлэгдлээ')
    setPending(null)
    load()
  }

  function openGrant(u) {
    setGrant({ id: u.id, name: u.full_name || u.email })
    setPlanId(plans[0] ? String(plans[0].id) : '')
    setMethod('cash')
  }

  async function submitGrant(e) {
    e.preventDefault()
    const plan = plans.find((p) => String(p.id) === planId)
    if (!plan) return toast.error('Багц сонгоно уу')
    setGranting(true)
    const start = new Date()
    const end = new Date(start.getTime() + plan.duration_days * 86400000)
    const fmt = (d) => d.toISOString().slice(0, 10)

    const { data: membership, error: mErr } = await supabase
      .from('memberships')
      .insert({ user_id: grant.id, plan_id: plan.id, status: 'active', start_date: fmt(start), end_date: fmt(end) })
      .select()
      .single()
    if (mErr) { setGranting(false); return toast.error(mErr.message) }

    const { error: pErr } = await supabase.from('payments').insert({
      user_id: grant.id,
      membership_id: membership.id,
      amount: plan.price,
      status: 'paid',
      provider: method,
      paid_at: new Date().toISOString(),
    })
    if (pErr) {
      await supabase.from('memberships').delete().eq('id', membership.id) // төлбөр бүртгэгдээгүй бол буцаана
      setGranting(false)
      return toast.error(pErr.message)
    }
    setGranting(false)
    toast.success(`${grant.name}-д "${plan.name}" багц олголоо`)
    setGrant(null)
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">Хэрэглэгчид</h2>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setPage(0); setSearch(input.trim().replace(/[,()]/g, '')) }}>
          <input className="input w-56" aria-label="Хэрэглэгч хайх" placeholder="Нэр эсвэл имэйлээр хайх" value={input} onChange={(e) => setInput(e.target.value)} />
          <button className="btn-outline" type="submit">Хайх</button>
        </form>
      </div>

      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={load} /> : rows.length === 0 ? (
        <EmptyState title="Хэрэглэгч олдсонгүй" text="Өөр түлхүүр үгээр хайгаад үз." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
              <tr><th className="px-4 py-3 font-semibold">Нэр</th><th className="px-4 py-3 font-semibold">Имэйл</th><th className="px-4 py-3 font-semibold">Утас</th><th className="px-4 py-3 font-semibold">Бүртгүүлсэн</th><th className="px-4 py-3 font-semibold">Эрх</th><th className="px-4 py-3 text-right font-semibold">Үйлдэл</th></tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {rows.map((u) => (
                <tr key={u.id} className="hover:bg-ink-50">
                  <td className="px-4 py-3">{u.full_name || '-'}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.phone || '-'}</td>
                  <td className="px-4 py-3">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3">
                    <select
                      className="input w-32 py-1"
                      aria-label={`${u.full_name || u.email}-ийн эрх`}
                      value={u.role}
                      disabled={u.id === user.id}
                      title={u.id === user.id ? 'Өөрийн эрхийг өөрчлөх боломжгүй' : ''}
                      onChange={(e) => setPending({ id: u.id, name: u.full_name || u.email, role: e.target.value })}
                    >
                      <option value="member">Гишүүн</option>
                      <option value="admin">Админ</option>
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button className="font-semibold text-tenger-700 hover:underline" onClick={() => openGrant(u)}>Багц олгох</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />

      <ConfirmDialog
        open={!!pending}
        title="Эрх өөрчлөх"
        message={pending && `${pending.name}-ийн эрхийг "${pending.role === 'admin' ? 'Админ' : 'Гишүүн'}" болгох уу?`}
        confirmText="Өөрчлөх"
        loading={saving}
        onConfirm={changeRole}
        onCancel={() => setPending(null)}
      />

      <Modal open={!!grant} title="Гишүүнчлэлийн багц олгох" onClose={() => !granting && setGrant(null)}>
        <form onSubmit={submitGrant} className="space-y-4">
          <p className="text-sm text-ink-600">Хэрэглэгч: <b className="text-ink-900">{grant?.name}</b></p>
          {plans.length === 0 ? (
            <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">Идэвхтэй багц байхгүй байна. Эхлээд "Багцууд" хэсэгт багц нэм.</p>
          ) : (
            <>
              <div>
                <label className="label" htmlFor="grant-plan">Багц</label>
                <select id="grant-plan" className="input" value={planId} onChange={(e) => setPlanId(e.target.value)}>
                  {plans.map((p) => <option key={p.id} value={p.id}>{p.name} · {formatMNT(p.price)}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="grant-method">Төлбөрийн хэлбэр</label>
                <select id="grant-method" className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
                  {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <p className="text-xs leading-relaxed text-ink-500">Гишүүнчлэл өнөөдрөөс эхлэн идэвхжиж, төлбөр "Төлөгдсөн" төлөвтэй бүртгэгдэнэ.</p>
            </>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-outline" onClick={() => setGrant(null)} disabled={granting}>Болих</button>
            <button type="submit" className="btn-primary" disabled={granting || plans.length === 0}>{granting ? 'Олгож байна...' : 'Багц олгох'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
