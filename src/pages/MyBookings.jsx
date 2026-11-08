import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { BOOKING_STATUS, dayLabel, formatDateTime, formatTime } from '../lib/format'
import Spinner from '../components/Spinner'
import ErrorBox from '../components/ErrorBox'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'

export default function MyBookings() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [target, setTarget] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase
      .from('bookings')
      .select('*, classes(starts_at, duration_min, class_types(name), trainers(name))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else setRows(data)
    setLoading(false)
  }, [user.id])

  useEffect(() => { load() }, [load])

  async function cancel() {
    setBusy(true)
    const { error: err } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', target.id)
    setBusy(false)
    setTarget(null)
    if (err) return toast.error(err.message)
    toast.success('Бүртгэл цуцлагдлаа')
    load()
  }

  const now = new Date()
  const upcoming = rows.filter((b) => b.status === 'booked' && new Date(b.classes.starts_at) > now).sort((a, b) => new Date(a.classes.starts_at) - new Date(b.classes.starts_at))
  const past = rows.filter((b) => !upcoming.includes(b)).sort((a, b) => new Date(b.classes.starts_at) - new Date(a.classes.starts_at))

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold text-ink-900 sm:text-4xl">Миний захиалга</h1>

      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={load} /> : rows.length === 0 ? (
        <div className="mt-8"><EmptyState title="Захиалга байхгүй байна" text="Ангийн хуваарь үзээд эхний ангидаа бүртгүүл." action={<Link to="/classes" className="btn-primary">Ангийн хуваарь үзэх</Link>} /></div>
      ) : (
        <>
          <h2 className="mb-4 mt-10 font-display text-lg font-medium text-ink-900">Удахгүй болох</h2>
          {upcoming.length === 0 ? <p className="text-sm text-ink-500">Удахгүй болох бүртгэл алга.</p> : (
            <div className="space-y-4">
              {upcoming.map((b) => (
                <article key={b.id} className="flex overflow-hidden rounded-3xl border border-ink-100 bg-white">
                  <div className="flex w-36 shrink-0 flex-col items-center justify-center gap-2 border-r-2 border-dashed border-ink-200 bg-tenger-50 p-4 sm:w-44">
                    <div className="rounded-2xl bg-white p-2.5"><QRCodeSVG value={b.qr_code} size={96} /></div>
                    <p className="text-xs font-semibold text-tenger-800">Ирцийн QR</p>
                  </div>
                  <div className="min-w-0 flex-1 p-5">
                    <p className="text-sm font-semibold text-ink-500">{dayLabel(b.classes.starts_at)}</p>
                    <p className="font-display text-2xl font-semibold text-ink-900">{formatTime(b.classes.starts_at)}</p>
                    <Link to={`/classes/${b.class_id}`} className="mt-2 block font-bold text-ink-900 hover:underline">{b.classes.class_types?.name}</Link>
                    <p className="text-sm text-ink-500">{b.classes.trainers?.name}</p>
                    <p className="mt-2 break-all text-[11px] text-ink-400">{b.qr_code}</p>
                    <button className="mt-3 text-sm font-semibold text-red-600 hover:underline" onClick={() => setTarget(b)}>Бүртгэл цуцлах</button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <h2 className="mb-4 mt-12 font-display text-lg font-medium text-ink-900">Өмнөх түүх</h2>
          {past.length === 0 ? <p className="text-sm text-ink-500">Түүх алга.</p> : (
            <div className="card divide-y divide-ink-100">
              {past.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold text-ink-900">{b.classes.class_types?.name}</p>
                    <p className="text-sm text-ink-500">{formatDateTime(b.classes.starts_at)} · {b.classes.trainers?.name}</p>
                  </div>
                  <span className={`badge ${BOOKING_STATUS[b.status].cls}`}>{BOOKING_STATUS[b.status].label}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <ConfirmDialog open={!!target} danger title="Бүртгэл цуцлах" message="Энэ ангид бүртгүүлсэн бүртгэлээ цуцлахдаа итгэлтэй байна уу?" confirmText="Цуцлах" loading={busy} onConfirm={cancel} onCancel={() => setTarget(null)} />
    </div>
  )
}
