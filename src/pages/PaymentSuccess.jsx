import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Spinner from '../components/Spinner'

// Webhook payments.status-ийг "paid" болгох хүртэл 2 секунд тутамд шалгана (хамгийн ихдээ ~40 сек)
export default function PaymentSuccess() {
  const [params] = useSearchParams()
  const paymentId = params.get('payment_id')
  const [status, setStatus] = useState('pending')
  const [timedOut, setTimedOut] = useState(false)
  const tries = useRef(0)

  useEffect(() => {
    if (!paymentId) return
    let stop = false
    async function poll() {
      const { data } = await supabase.from('payments').select('status').eq('id', paymentId).maybeSingle()
      if (stop) return
      if (data?.status === 'paid' || data?.status === 'failed') return setStatus(data.status)
      tries.current += 1
      if (tries.current >= 20) return setTimedOut(true)
      setTimeout(poll, 2000)
    }
    poll()
    return () => { stop = true }
  }, [paymentId])

  if (!paymentId) {
    return <div className="mx-auto max-w-md px-4 py-16 text-center"><p>Төлбөрийн мэдээлэл олдсонгүй.</p><Link to="/plans" className="btn-primary mt-4">Багц руу буцах</Link></div>
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="card p-8">
        {status === 'paid' ? (
          <>
            <div className="text-5xl">🎉</div>
            <h1 className="mt-4 text-2xl font-bold">Төлбөр амжилттай!</h1>
            <p className="mt-2 text-sm text-ink-600">Таны гишүүнчлэл идэвхжлээ. Одоо ангид бүртгүүлэх боломжтой.</p>
            <div className="mt-6 flex justify-center gap-2">
              <Link to="/classes" className="btn-primary">Анги сонгох</Link>
              <Link to="/account" className="btn-outline">Миний данс</Link>
            </div>
          </>
        ) : status === 'failed' ? (
          <>
            <div className="text-5xl">❌</div>
            <h1 className="mt-4 text-xl font-bold">Төлбөр амжилтгүй боллоо</h1>
            <Link to="/plans" className="btn-primary mt-6">Дахин оролдох</Link>
          </>
        ) : timedOut ? (
          <>
            <div className="text-5xl">⏳</div>
            <h1 className="mt-4 text-xl font-bold">Төлбөр баталгаажиж байна</h1>
            <p className="mt-2 text-sm text-ink-600">Баталгаажихад хэсэг хугацаа шаардлагатай байж болно. "Миний данс" хуудсаас төлөвийг шалгана уу.</p>
            <Link to="/account" className="btn-primary mt-6">Миний данс</Link>
          </>
        ) : (
          <>
            <Spinner label="Төлбөрийг баталгаажуулж байна..." />
            <p className="text-xs text-ink-400">Энэ хуудсыг хаахгүй байна уу</p>
          </>
        )}
      </div>
    </div>
  )
}
