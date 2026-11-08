import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { isEmail } from '../lib/format'

export default function ForgotPassword() {
  const { sendResetEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!isEmail(email)) return setError('Имэйл хаяг буруу байна')
    setError('')
    setBusy(true)
    const { error: err } = await sendResetEmail(email.trim())
    setBusy(false)
    if (err) return toast.error(err.message)
    setSent(true)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="card p-6 sm:p-8">
        <h1 className="font-display text-2xl font-semibold">Нууц үг сэргээх</h1>
        {sent ? (
          <p className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">Сэргээх холбоосыг <b>{email}</b> хаяг руу илгээлээ. Имэйлээ шалгана уу.</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <div>
              <label className="label" htmlFor="email">Бүртгэлтэй имэйл</label>
              <input id="email" type="email" className={`input ${error ? 'input-error' : ''}`} value={email} onChange={(e) => setEmail(e.target.value)} />
              {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            </div>
            <button className="btn-primary w-full" disabled={busy}>{busy ? 'Илгээж байна...' : 'Холбоос илгээх'}</button>
          </form>
        )}
        <p className="mt-6 text-center text-sm"><Link to="/login" className="text-tenger-700 hover:underline">← Нэвтрэх хуудас руу буцах</Link></p>
      </div>
    </div>
  )
}
