import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PAYMENT_STATUS, formatDateTime, formatMNT } from '../../lib/format'
import Spinner from '../../components/Spinner'
import ErrorBox from '../../components/ErrorBox'
import EmptyState from '../../components/EmptyState'
import Pagination from '../../components/Pagination'

const PAGE_SIZE = 10

export default function AdminPayments() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    let q = supabase.from('payments').select('*, profiles(full_name, email), memberships(membership_plans(name))', { count: 'exact' })
    if (status) q = q.eq('status', status)
    const { data, error: err, count } = await q.order('created_at', { ascending: false }).range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
    if (err) setError(err.message)
    else { setRows(data); setTotal(count ?? 0) }
    setLoading(false)
  }, [page, status])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Төлбөрүүд</h2>
        <select className="input w-48" value={status} onChange={(e) => { setPage(0); setStatus(e.target.value) }}>
          <option value="">Бүх төлөв</option>
          {Object.entries(PAYMENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={load} /> : rows.length === 0 ? (
        <EmptyState title="Төлбөр олдсонгүй" text="Сонгосон төлөвт тохирох төлбөр алга байна." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-200 bg-ink-50 text-xs uppercase text-ink-500">
              <tr><th className="px-4 py-3">Хэрэглэгч</th><th className="px-4 py-3">Багц</th><th className="px-4 py-3">Дүн</th><th className="px-4 py-3">Төлөв</th><th className="px-4 py-3">Үүссэн</th><th className="px-4 py-3">Төлөгдсөн</th></tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-ink-50">
                  <td className="px-4 py-3">{p.profiles?.full_name || p.profiles?.email || '-'}</td>
                  <td className="px-4 py-3">{p.memberships?.membership_plans?.name}</td>
                  <td className="px-4 py-3">{formatMNT(p.amount)}</td>
                  <td className="px-4 py-3"><span className={`badge ${PAYMENT_STATUS[p.status].cls}`}>{PAYMENT_STATUS[p.status].label}</span></td>
                  <td className="px-4 py-3">{formatDateTime(p.created_at)}</td>
                  <td className="px-4 py-3">{formatDateTime(p.paid_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
    </div>
  )
}
