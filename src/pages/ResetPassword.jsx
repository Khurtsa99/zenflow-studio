import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/Spinner'

// Имэйлээс ирсэн холбоосоор орж ирэхэд Supabase түр session үүсгэнэ
export default function ResetPassword() {
  const { session, loading, updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) return <Spinner />

  if (!session) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="card p-6 text-center">
          <p className="text-sm text-ink-600">Холбоос хүчингүй эсвэл хугацаа нь дууссан байна.</p>
          <Link to="/forgot-password" className="btn-primary mt-4">Шинэ холбоос авах</Link>
        </div>
      </div>
    )
  }

  async function submit(e) {
    e.preventDefault()
    if (password.length < 6) return setError('Нууц үг хамгийн багадаа 6 тэмдэгт байна')
    if (password !== confirm) return setError('Нууц үг таарахгүй байна')
    setError('')
    setBusy(true)
    const { error: err } = await updatePassword(password)
    setBusy(false)
    if (err) return toast.error(err.message)
    toast.success('Нууц үг шинэчлэгдлээ')
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="card p-6 sm:p-8">
        <h1 className="font-display text-2xl font-semibold">Шинэ нууц үг</h1>
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <div>
            <label className="label" htmlFor="p1">Шинэ нууц үг</label>
            <input id="p1" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="p2">Давтах</label>
            <input id="p2" type="password" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Хадгалж байна...' : 'Нууц үг солих'}</button>
        </form>
      </div>
    </div>
  )
}
