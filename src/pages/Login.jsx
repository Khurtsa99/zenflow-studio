import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { isEmail } from '../lib/format'

export default function Login() {
  const { signIn, session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to={from} replace />

  async function submit(e) {
    e.preventDefault()
    const errs = {}
    if (!isEmail(form.email)) errs.email = 'Имэйл хаяг буруу байна'
    if (!form.password) errs.password = 'Нууц үгээ оруулна уу'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    const { error } = await signIn(form.email.trim(), form.password)
    setBusy(false)
    if (error) return toast.error(error.message === 'Invalid login credentials' ? 'Имэйл эсвэл нууц үг буруу байна' : error.message)
    toast.success('Тавтай морил!')
    navigate(from, { replace: true })
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="card p-6 sm:p-8">
        <h1 className="font-display text-2xl font-semibold">Нэвтрэх</h1>
        <p className="mt-1 text-sm text-ink-500">ZenFlow дансаараа нэвтэрнэ үү.</p>
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <div>
            <label className="label" htmlFor="email">Имэйл</label>
            <input id="email" type="email" autoComplete="email" className={`input ${errors.email ? 'input-error' : ''}`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>
          <div>
            <label className="label" htmlFor="password">Нууц үг</label>
            <input id="password" type="password" autoComplete="current-password" className={`input ${errors.password ? 'input-error' : ''}`} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>
          <div className="text-right text-sm"><Link to="/forgot-password" className="text-tenger-700 hover:underline">Нууц үгээ мартсан уу?</Link></div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Нэвтэрч байна...' : 'Нэвтрэх'}</button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-600">Данс байхгүй юу? <Link to="/register" className="font-medium text-tenger-700 hover:underline">Бүртгүүлэх</Link></p>
      </div>
    </div>
  )
}
