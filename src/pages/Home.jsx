import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { formatMNT, formatTime, relativeDay } from '../lib/format'
import BreathCircle from '../components/BreathCircle'
import Carousel from '../components/Carousel'
import ClassPoster from '../components/ClassPoster'
import Icon from '../components/Icon'
import Spinner from '../components/Spinner'
import ErrorBox from '../components/ErrorBox'

const steps = [
  { title: 'Багцаа сонго', text: 'Сарын эсвэл улирлын гишүүнчлэлээс өөрт тохирохыг нь онлайнаар төл.' },
  { title: 'Ангидаа бүртгүүл', text: 'Цаг, дасгалжуулагч, үлдсэн суудлыг хараад нэг товшилтоор бүртгүүл.' },
  { title: 'QR-аараа ирцээ бүртгүүл', text: 'Бүртгэл бүр QR кодтой. Студид ирээд уншуулахад л болно.' },
]

const ease = [0.22, 1, 0.36, 1]
const HEADLINE = ['Амьсгалаа сонс.', 'Биеэ хөдөлгө.']

// Гарчгийн мөр бүр доороосоо маск дундуур гулсан гарч ирнэ
function Line({ children, i }) {
  return (
    <span className="block overflow-hidden pb-1">
      <motion.span className="block" initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ duration: 0.8, delay: 0.1 + i * 0.12, ease }}>
        {children}
      </motion.span>
    </span>
  )
}

const reveal = {
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease },
}

export default function Home() {
  const [classes, setClasses] = useState([])
  const [trainers, setTrainers] = useState([])
  const [minPrice, setMinPrice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const circleY = useTransform(scrollYProgress, [0, 1], [0, 90])
  const circleRot = useTransform(scrollYProgress, [0, 1], [0, 14])

  async function load() {
    setLoading(true)
    setError('')
    const [c, p, t] = await Promise.all([
      supabase.from('classes').select('*, class_types(name, level, image_url), trainers(name)').gte('starts_at', new Date().toISOString()).order('starts_at').limit(8),
      supabase.from('membership_plans').select('price').eq('is_active', true).order('price').limit(1),
      supabase.from('trainers').select('id, name, specialty, photo_url').order('name'),
    ])
    const err = c.error || p.error || t.error
    if (err) setError(err.message)
    else {
      setClasses(c.data)
      setMinPrice(p.data?.[0]?.price ?? null)
      setTrainers(t.data || [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const next = classes[0]

  return (
    <div>
      {/* HERO */}
      <section ref={heroRef} className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-10 sm:pt-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 rounded-full bg-saffron-soft px-3 py-1 text-xs font-bold text-saffron-deep">
            <span className="h-2 w-2 rounded-full bg-saffron-deep" /> Шинэ ангиуд долоо хоног бүр
          </motion.span>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink-900 sm:text-5xl lg:text-[3.6rem]">
            {HEADLINE.map((l, i) => <Line key={l} i={i}>{l}</Line>)}
          </h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5, ease }} className="mt-6 max-w-md text-lg leading-relaxed text-ink-600">
            Йога, Pilates, HIIT ангид онлайнаар бүртгүүлж, гишүүнчлэлээ нэг дор удирд.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.65, ease }} className="mt-9 flex flex-wrap gap-3">
            <Link to="/classes" className="btn-primary px-7 py-3 text-base">Ангийн хуваарь үзэх <Icon name="arrow" size={18} /></Link>
            <Link to="/plans" className="btn-outline px-7 py-3 text-base">Гишүүнчлэл авах</Link>
          </motion.div>
        </div>

        <motion.div style={{ y: circleY, rotate: circleRot }} className="relative" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.2, ease }}>
          <BreathCircle />
          {next && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
              transition={{ opacity: { delay: 1 }, x: { delay: 1, duration: 0.6, ease }, y: { delay: 1.6, duration: 5, repeat: Infinity, ease: 'easeInOut' } }}
              className="absolute -bottom-2 left-0 hidden rounded-3xl bg-white p-4 shadow-[0_18px_40px_-16px_rgba(14,27,51,0.35)] sm:block"
            >
              <p className="text-xs font-bold text-ink-500">Дараагийн анги</p>
              <p className="mt-1 font-display text-lg font-semibold text-ink-900">{next.class_types?.name}</p>
              <p className="text-sm text-ink-600">{relativeDay(next.starts_at)} · {formatTime(next.starts_at)}</p>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* SWIPE: ОЙРЫН АНГИУД */}
      <section className="mx-auto max-w-[88rem] px-3">
        <div className="rounded-[2.5rem] bg-ink-900 px-6 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <motion.div {...reveal} className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-saffron">Хажуу тийш шудраарай</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-white sm:text-4xl">Ойрын ангиуд</h2>
              </div>
              <Link to="/classes" className="hidden text-sm font-semibold text-white/80 hover:text-white sm:inline">Бүх хуваарь →</Link>
            </motion.div>
            {loading ? <div className="text-white"><Spinner /></div> : error ? <ErrorBox message={error} onRetry={load} /> : classes.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-white/20 p-10 text-center text-sm text-white/60">Одоогоор товлогдсон анги алга байна.</p>
            ) : (
              <Carousel dark label="Ойрын ангиуд">
                {classes.map((c) => <ClassPoster key={c.id} cls={c} />)}
              </Carousel>
            )}
          </div>
        </div>
      </section>

      {/* ГУРВАН АЛХАМ */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <motion.h2 {...reveal} className="mb-12 font-display text-2xl font-semibold text-ink-900 sm:text-4xl">Гурван алхамаар</motion.h2>
        <ol className="grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.li
              key={s.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.12, ease }}
              whileHover={{ y: -6 }}
              className="rounded-4xl bg-white p-7 shadow-[0_10px_30px_-18px_rgba(14,27,51,0.25)]"
            >
              <span className="font-display text-5xl font-semibold text-tenger-200">0{i + 1}</span>
              <h3 className="mt-4 text-lg font-bold text-ink-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{s.text}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* ДАСГАЛЖУУЛАГЧИД */}
      {trainers.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-24">
          <motion.div {...reveal} className="mb-8">
            <p className="text-sm font-bold text-tenger-700">Манай баг</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink-900 sm:text-4xl">Дасгалжуулагчид</h2>
          </motion.div>
          <Carousel label="Дасгалжуулагчид">
            {trainers.map((t, i) => (
              <motion.div key={t.id} whileHover={{ y: -8 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }} className="w-[70%] shrink-0 snap-start sm:w-64">
                <div className="aspect-[4/5] overflow-hidden rounded-4xl bg-tenger-100">
                  {t.photo_url
                    ? <img src={t.photo_url} alt={t.name} draggable={false} className="h-full w-full object-cover" loading="lazy" />
                    : <div className="flex h-full items-center justify-center font-display text-6xl font-semibold text-tenger-600">{t.name.charAt(0)}</div>}
                </div>
                <h3 className="mt-3 font-bold text-ink-900">{t.name}</h3>
                <p className="text-sm text-ink-500">{t.specialty}</p>
              </motion.div>
            ))}
          </Carousel>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4">
        <motion.div {...reveal} className="relative overflow-hidden rounded-4xl bg-saffron p-8 text-ink-900 sm:p-14">
          <motion.span aria-hidden="true" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/30" />
          <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-display text-2xl font-semibold sm:text-4xl">Эхний ангидаа бүртгүүл</h2>
              {minPrice !== null && <p className="mt-3 font-semibold text-ink-800">Гишүүнчлэл {formatMNT(minPrice)}-аас эхэлнэ.</p>}
            </div>
            <Link to="/plans" className="btn bg-ink-900 px-7 py-3 text-base text-white hover:bg-ink-800">Багц сонгох <Icon name="arrow" size={18} /></Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
