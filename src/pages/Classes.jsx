import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { LEVELS, dayLabel, toDateKey, weekdayShort } from '../lib/format'
import ClassRow from '../components/ClassRow'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'
import Spinner from '../components/Spinner'
import ErrorBox from '../components/ErrorBox'
import EmptyState from '../components/EmptyState'

const PAGE_SIZE = 10
const INITIAL = { search: '', type: '', trainer: '', level: '', date: '', maxPrice: '', sort: 'time_asc' }

function nextDays(n = 7) {
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    return d
  })
}

// Идэвхтэй сонголтын арын өнгө нэг товчоос нөгөө рүү гулсана
function Pill({ active, id, onClick, children, stacked = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative shrink-0 rounded-full border border-ink-200 bg-white px-4 text-sm font-semibold transition-colors ${stacked ? 'py-1.5 leading-tight' : 'py-2.5'} ${active ? 'border-transparent text-white' : 'text-ink-700 hover:border-ink-300'}`}
    >
      {active && <motion.span layoutId={id} className="absolute inset-0 rounded-full bg-ink-900" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
      <span className="relative block">{children}</span>
    </button>
  )
}

export default function Classes() {
  const [filters, setFilters] = useState(INITIAL)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showMore, setShowMore] = useState(false)
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [types, setTypes] = useState([])
  const [trainers, setTrainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const days = useMemo(() => nextDays(7), [])
  const todayKey = toDateKey(new Date())

  useEffect(() => {
    supabase.from('class_types').select('id, name').order('name').then(({ data }) => setTypes(data || []))
    supabase.from('trainers').select('id, name').order('name').then(({ data }) => setTrainers(data || []))
  }, [])

  // Хайлтын талбарт 300мс debounce
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(filters.search.trim()); setPage(0) }, 300)
    return () => clearTimeout(t)
  }, [filters.search])

  const set = (k, v) => { setFilters((f) => ({ ...f, [k]: v })); setPage(0) }
  const setInput = (k) => (e) => set(k, e.target.value)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      let q = supabase
        .from('classes')
        .select('*, class_types!inner(id, name, level, image_url), trainers(id, name)', { count: 'exact' })

      const now = new Date()
      if (filters.date) {
        const start = new Date(`${filters.date}T00:00:00`)
        const end = new Date(start); end.setDate(end.getDate() + 1)
        q = q.gte('starts_at', (start < now ? now : start).toISOString()).lt('starts_at', end.toISOString())
      } else {
        q = q.gte('starts_at', now.toISOString())
      }
      if (debouncedSearch) q = q.ilike('class_types.name', `%${debouncedSearch.replace(/[%_]/g, '')}%`)
      if (filters.type) q = q.eq('class_type_id', Number(filters.type))
      if (filters.trainer) q = q.eq('trainer_id', Number(filters.trainer))
      if (filters.level) q = q.eq('class_types.level', filters.level)
      if (filters.maxPrice !== '') q = q.lte('price', Number(filters.maxPrice))

      if (filters.sort === 'price_asc') q = q.order('price', { ascending: true }).order('starts_at')
      else if (filters.sort === 'price_desc') q = q.order('price', { ascending: false }).order('starts_at')
      else q = q.order('starts_at', { ascending: true })

      const { data, error: err, count } = await q.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
      if (cancelled) return
      if (err) setError(err.message)
      else { setRows(data); setTotal(count ?? 0) }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [debouncedSearch, filters.type, filters.trainer, filters.level, filters.date, filters.maxPrice, filters.sort, page, reloadKey])

  // Өдрөөр бүлэглэнэ (үнээр эрэмбэлсэн үед ч өдрийн гарчиг зөв гарна)
  const groups = useMemo(() => {
    const m = new Map()
    rows.forEach((r) => {
      const k = toDateKey(new Date(r.starts_at))
      if (!m.has(k)) m.set(k, [])
      m.get(k).push(r)
    })
    return [...m.entries()]
  }, [rows])

  const hasFilters = JSON.stringify(filters) !== JSON.stringify(INITIAL)
  const extraCount = [filters.trainer, filters.level, filters.maxPrice, filters.sort !== 'time_asc' ? 'x' : ''].filter(Boolean).length

  function reset() {
    setFilters(INITIAL)
    setDebouncedSearch('')
    setPage(0)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold text-ink-900 sm:text-4xl">Ангийн хуваарь</h1>
      <p className="mt-3 text-ink-600">Өдрөө сонгоод, өөрт тохирох ангиа ол.</p>

      <div className="mt-8 space-y-4">
        <div className="relative">
          <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            aria-label="Ангийн нэрээр хайх"
            className="input rounded-full py-3 pl-11"
            placeholder="Ангийн нэрээр хайх, жишээ нь Yoga"
            value={filters.search}
            onChange={setInput('search')}
          />
        </div>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Өдөр сонгох">
          <Pill active={filters.date === ''} id="day-pill" onClick={() => set('date', '')}>Бүх өдөр</Pill>
          {days.map((d) => {
            const key = toDateKey(d)
            return (
              <Pill key={key} active={filters.date === key} id="day-pill" onClick={() => set('date', key)} stacked>
                <span className="block text-xs font-medium opacity-80">{key === todayKey ? 'Өнөөдөр' : weekdayShort(d)}</span>
                <span className="block font-display text-base">{d.getDate()}</span>
              </Pill>
            )
          })}
        </div>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Ангийн төрөл">
          <Pill active={filters.type === ''} id="type-pill" onClick={() => set('type', '')}>Бүх төрөл</Pill>
          {types.map((t) => (
            <Pill key={t.id} active={filters.type === String(t.id)} id="type-pill" onClick={() => set('type', String(t.id))}>{t.name}</Pill>
          ))}
        </div>

        <div>
          <button className="inline-flex items-center gap-2 text-sm font-semibold text-tenger-700 hover:underline" onClick={() => setShowMore((v) => !v)} aria-expanded={showMore}>
            <Icon name="sliders" size={16} />
            Нэмэлт шүүлтүүр{extraCount > 0 ? ` (${extraCount})` : ''}
          </button>
          {showMore && (
            <div className="card mt-3 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="label" htmlFor="trainer">Дасгалжуулагч</label>
                <select id="trainer" className="input" value={filters.trainer} onChange={setInput('trainer')}>
                  <option value="">Бүгд</option>
                  {trainers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="level">Түвшин</label>
                <select id="level" className="input" value={filters.level} onChange={setInput('level')}>
                  <option value="">Бүгд</option>
                  {Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="maxPrice">Дээд үнэ (₮)</label>
                <input id="maxPrice" type="number" min="0" step="1000" className="input" placeholder="20000" value={filters.maxPrice} onChange={setInput('maxPrice')} />
              </div>
              <div>
                <label className="label" htmlFor="sort">Эрэмбэлэх</label>
                <select id="sort" className="input" value={filters.sort} onChange={setInput('sort')}>
                  <option value="time_asc">Цагаар</option>
                  <option value="price_asc">Үнэ өсөхөөр</option>
                  <option value="price_desc">Үнэ буурахаар</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={() => setReloadKey((k) => k + 1)} /> : rows.length === 0 ? (
          <EmptyState
            title="Тохирох анги олдсонгүй"
            text="Өөр өдөр, төрөл сонгох эсвэл шүүлтүүрээ цэвэрлээд үз."
            action={hasFilters && <button className="btn-outline" onClick={reset}>Шүүлтүүр цэвэрлэх</button>}
          />
        ) : (
          <div className="space-y-8">
            {groups.map(([key, list]) => (
              <section key={key} aria-label={dayLabel(list[0].starts_at)}>
                <h2 className="mb-3 flex items-baseline gap-3 font-display text-lg font-medium text-ink-900">
                  {dayLabel(list[0].starts_at)}
                  {key === todayKey && <span className="badge bg-saffron-soft text-saffron-deep">Өнөөдөр</span>}
                </h2>
                <div className="space-y-3">
                  {list.map((c, i) => (
                    <motion.div key={c.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: Math.min(i, 8) * 0.05, ease: [0.22, 1, 0.36, 1] }}>
                      <ClassRow cls={c} />
                    </motion.div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
      </div>
    </div>
  )
}
