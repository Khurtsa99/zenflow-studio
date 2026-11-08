import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { isEmail } from '../lib/format'

export default function Register() {
  const { signUp, session } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to="/" replace />

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    const errs = {}
    if (form.full_name.trim().length < 2) errs.full_name = 'Нэрээ оруулна уу'
    if (!isEmail(form.email)) errs.email = 'Имэйл хаяг буруу байна'
    if (form.password.length < 6) errs.password = 'Нууц үг хамгийн багадаа 6 тэмдэгт байна'
    if (form.confirm !== form.password) errs.confirm = 'Нууц үг таарахгүй байна'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    const { data, error } = await signUp(form.email.trim(), form.password, form.full_name.trim())
    setBusy(false)
    if (error) return toast.error(error.message.includes('already') ? 'Энэ имэйл бүртгэлтэй байна' : error.message)
    if (data.session) {
      toast.success('Амжилттай бүртгэгдлээ')
      navigate('/')
    } else {
      toast.success('Имэйлээ шалгаад бүртгэлээ баталгаажуулна уу', { duration: 6000 })
      navigate('/login')
    }
  }

  const field = (k, label, type = 'text', auto) => (
    <div>
      <label className="label" htmlFor={k}>{label}</label>
      <input id={k} type={type} autoComplete={auto} className={`input ${errors[k] ? 'input-error' : ''}`} value={form[k]} onChange={set(k)} />
      {errors[k] && <p className="mt-1 text-xs text-red-600">{errors[k]}</p>}
    </div>
  )

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="card p-6 sm:p-8">
        <h1 className="font-display text-2xl font-semibold">Бүртгүүлэх</h1>
        <p className="mt-1 text-sm text-ink-500">Шинэ данс үүсгээд ангид бүртгүүлээрэй.</p>
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          {field('full_name', 'Овог нэр', 'text', 'name')}
          {field('email', 'Имэйл', 'email', 'email')}
          {field('password', 'Нууц үг', 'password', 'new-password')}
          {field('confirm', 'Нууц үг давтах', 'password', 'new-password')}
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Бүртгэж байна...' : 'Бүртгүүлэх'}</button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-600">Бүртгэлтэй юу? <Link to="/login" className="font-medium text-tenger-700 hover:underline">Нэвтрэх</Link></p>
      </div>
    </div>
  )
}
