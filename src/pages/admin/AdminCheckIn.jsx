import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { BOOKING_STATUS, formatDateTime } from '../../lib/format'
import Spinner from '../../components/Spinner'
import ErrorBox from '../../components/ErrorBox'
import EmptyState from '../../components/EmptyState'

export default function AdminCheckIn() {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const start = new Date(); start.setHours(0, 0, 0, 0)
    const end = new Date(start); end.setDate(end.getDate() + 1)
    const { data, error: err } = await supabase
      .from('bookings')
      .select('id, status, qr_code, profiles(full_name), classes!inner(starts_at, class_types(name))')
      .gte('classes.starts_at', start.toISOString())
      .lt('classes.starts_at', end.toISOString())
      .neq('status', 'cancelled')
    if (err) setError(err.message)
    else setRows((data || []).sort((a, b) => new Date(a.classes.starts_at) - new Date(b.classes.starts_at)))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function checkIn(qr) {
    setBusy(true)
    setResult(null)
    const { data, error: err } = await supabase.rpc('check_in', { p_qr: qr })
    setBusy(false)
    if (err) return toast.error(err.message)
    setResult(data)
    toast.success('Ирц бүртгэгдлээ')
    setCode('')
    load()
  }

  function submit(e) {
    e.preventDefault()
    const v = code.trim()
    if (!/^[0-9a-fA-F-]{36}$/.test(v)) return toast.error('QR кодын формат буруу байна')
    checkIn(v)
  }

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h2 className="mb-1 text-xl font-semibold">QR кодоор ирц бүртгэх</h2>
        <p className="mb-4 text-sm text-ink-500">Гишүүний "Миний захиалга" хуудсан дээрх QR кодын текстийг оруулна (эсвэл QR уншигч төхөөрөмжөөр уншуулна).</p>
        <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
          <input className="input flex-1" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={code} onChange={(e) => setCode(e.target.value)} />
          <button className="btn-primary" disabled={busy}>{busy ? 'Шалгаж байна...' : 'Ирц бүртгэх'}</button>
        </form>
        {result && (
          <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
            ✅ <b>{result.full_name}</b> · {result.class_name} · {formatDateTime(result.starts_at)}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold">Өнөөдрийн бүртгэлүүд</h3>
        {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={load} /> : rows.length === 0 ? (
          <EmptyState title="Өнөөдөр бүртгэл алга" text="Өнөөдрийн ангид бүртгүүлсэн гишүүн олдсонгүй." />
        ) : (
          <div className="card divide-y divide-ink-100">
            {rows.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{b.profiles?.full_name || 'Нэргүй'}</p>
                  <p className="text-sm text-ink-500">{b.classes.class_types?.name} · {formatDateTime(b.classes.starts_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${BOOKING_STATUS[b.status].cls}`}>{BOOKING_STATUS[b.status].label}</span>
                  {b.status === 'booked' && <button className="btn-outline" disabled={busy} onClick={() => checkIn(b.qr_code)}>Ирсэн</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
