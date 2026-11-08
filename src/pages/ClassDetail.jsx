import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { LEVELS, dayLabel, formatMNT, formatTime } from '../lib/format'
import PoseArt from '../components/PoseArt'
import { poseFor, typeTheme } from '../lib/theme'
import Icon from '../components/Icon'
import Spinner from '../components/Spinner'
import ErrorBox from '../components/ErrorBox'
import ConfirmDialog from '../components/ConfirmDialog'

export default function ClassDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const location = useLocation()
  const [cls, setCls] = useState(null)
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const load = useCallback(async () => {
    setError('')
    const { data, error: err } = await supabase
      .from('classes')
      .select('*, class_types(name, description, level, image_url), trainers(name, bio, specialty, photo_url)')
      .eq('id', id)
      .maybeSingle()
    if (err) { setError(err.message); setLoading(false); return }
    setCls(data)
    if (user && data) {
      const { data: b } = await supabase.from('bookings').select('*').eq('class_id', data.id).eq('user_id', user.id).maybeSingle()
      setBooking(b)
    } else {
      setBooking(null)
    }
    setLoading(false)
  }, [id, user])

  useEffect(() => { load() }, [load])

  async function book() {
    setBusy(true)
    // Өмнө цуцалсан захиалга байвал дахин нээнэ (unique user_id+class_id)
    const res = booking
      ? await supabase.from('bookings').update({ status: 'booked' }).eq('id', booking.id)
      : await supabase.from('bookings').insert({ user_id: user.id, class_id: cls.id, status: 'booked' })
    setBusy(false)
    if (res.error) return toast.error(res.error.message)
    toast.success('Ангид бүртгүүллээ')
    load()
  }

  async function cancel() {
    setBusy(true)
    const { error: err } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
    setBusy(false)
    setConfirmCancel(false)
    if (err) return toast.error(err.message)
    toast.success('Бүртгэл цуцлагдлаа')
    load()
  }

  if (loading) return <Spinner />
  if (error) return <div className="mx-auto max-w-3xl px-4 py-10"><ErrorBox message={error} onRetry={load} /></div>
  if (!cls) return <div className="mx-auto max-w-3xl px-4 py-10"><ErrorBox message="Анги олдсонгүй" /></div>

  const left = cls.capacity - cls.booked_count
  const full = left <= 0
  const ratio = Math.min(1, cls.booked_count / cls.capacity)
  const started = new Date(cls.starts_at) <= new Date()
  const active = booking && booking.status !== 'cancelled'

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/classes" className="text-sm font-semibold text-tenger-700 hover:underline">Бүх анги</Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="relative h-56 overflow-hidden rounded-4xl sm:h-72" style={{ backgroundColor: typeTheme(cls.class_types?.name).bg }}>
            {cls.class_types?.image_url
              ? <img src={cls.class_types.image_url} alt={cls.class_types.name} className="h-full w-full object-cover" />
              : <PoseArt pose={poseFor(cls.class_types?.name)} color={typeTheme(cls.class_types?.name).fg} className="absolute inset-0 h-full w-full p-6" />}
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <span className="badge bg-white/90 text-ink-800">{LEVELS[cls.class_types?.level]}</span>
              <h1 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">{cls.class_types?.name}</h1>
            </div>
          </div>

          <p className="mt-6 max-w-prose text-base leading-relaxed text-ink-700">{cls.class_types?.description || 'Тайлбар оруулаагүй байна.'}</p>

          <h2 className="mt-10 font-display text-lg font-medium text-ink-900">Дасгалжуулагч</h2>
          <div className="mt-4 flex items-start gap-4">
            {cls.trainers?.photo_url
              ? <img src={cls.trainers.photo_url} alt={cls.trainers.name} className="h-16 w-16 rounded-full object-cover" />
              : <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink-100 text-ink-400"><Icon name="user" size={26} /></div>}
            <div>
              <p className="font-bold text-ink-900">{cls.trainers?.name}</p>
              {cls.trainers?.specialty && <p className="text-sm text-ink-500">{cls.trainers.specialty}</p>}
              {cls.trainers?.bio && <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-600">{cls.trainers.bio}</p>}
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <p className="text-sm font-semibold text-ink-500">{dayLabel(cls.starts_at)}</p>
            <p className="mt-1 font-display text-4xl font-semibold text-ink-900">{formatTime(cls.starts_at)}</p>
            <p className="mt-1 text-sm text-ink-500">{cls.duration_min} минут</p>

            <div className="mt-6">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-semibold text-ink-900">{full ? 'Дүүрсэн' : `${left} суудал үлдсэн`}</span>
                <span className="text-ink-500">{cls.booked_count} / {cls.capacity}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100" aria-hidden="true">
                <div className={`h-full rounded-full ${full ? 'bg-ink-400' : ratio >= 0.75 ? 'bg-saffron' : 'bg-tenger-500'}`} style={{ width: `${Math.max(4, ratio * 100)}%` }} />
              </div>
            </div>

            <p className="mt-5 text-sm text-ink-600">{Number(cls.price) > 0 ? `Нэг удаагийн үнэ: ${formatMNT(cls.price)}` : 'Гишүүнчлэлд багтана'}</p>

            <div className="mt-6 space-y-3">
              {!user ? (
                <Link to="/login" state={{ from: location }} className="btn-primary w-full py-3">Нэвтэрч бүртгүүлэх</Link>
              ) : active ? (
                <>
                  <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                    <Icon name="check" size={18} /> Та энэ ангид бүртгэлтэй
                  </div>
                  <Link to="/my-bookings" className="btn-primary w-full py-3">QR кодоо харах</Link>
                  {booking.status === 'booked' && !started && (
                    <button className="btn-outline w-full" onClick={() => setConfirmCancel(true)} disabled={busy}>Бүртгэл цуцлах</button>
                  )}
                </>
              ) : started ? (
                <div className="rounded-2xl bg-ink-100 p-3 text-center text-sm font-semibold text-ink-600">Анги эхэлсэн</div>
              ) : full ? (
                <div className="rounded-2xl bg-red-50 p-3 text-center text-sm font-semibold text-red-700">Анги дүүрсэн</div>
              ) : (
                <button className="btn-primary w-full py-3" onClick={book} disabled={busy}>{busy ? 'Бүртгэж байна...' : 'Ангид бүртгүүлэх'}</button>
              )}
            </div>

            {user && !active && !started && !full && (
              <p className="mt-4 text-xs leading-relaxed text-ink-500">
                Бүртгүүлэхэд идэвхтэй гишүүнчлэл шаардлагатай. <Link to="/plans" className="font-semibold text-tenger-700 underline">Багц харах</Link>
              </p>
            )}
          </div>
        </aside>
      </div>

      <ConfirmDialog open={confirmCancel} danger title="Бүртгэл цуцлах" message="Энэ ангид бүртгүүлсэн бүртгэлээ цуцлахдаа итгэлтэй байна уу?" confirmText="Цуцлах" loading={busy} onConfirm={cancel} onCancel={() => setConfirmCancel(false)} />
    </div>
  )
}
