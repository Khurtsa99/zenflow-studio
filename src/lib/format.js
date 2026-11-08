const pad = (n) => String(n).padStart(2, '0')
const WEEKDAYS = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба']

export const formatMNT = (n) => `${new Intl.NumberFormat('mn-MN').format(Number(n || 0))}₮`

// 2026.11.09
export const formatDate = (iso) => {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
}

// 16:00
export const formatTime = (iso) => {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 2026.11.09 16:00
export const formatDateTime = (iso) => (iso ? `${formatDate(iso)} ${formatTime(iso)}` : '-')

export const weekdayShort = (d) => WEEKDAYS[d.getDay()]

// Орон нутгийн огноог "2026-11-09" болгоно (шүүлтүүр, бүлэглэлтэд)
export const toDateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// Даваа, 11-р сарын 9
export const dayLabel = (iso) => {
  const d = new Date(iso)
  return `${WEEKDAYS[d.getDay()]}, ${d.getMonth() + 1}-р сарын ${d.getDate()}`
}

// Өнөөдөр / Маргааш / Лхагва 11.12
export const relativeDay = (iso) => {
  const d = new Date(iso)
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const n = new Date()
  const b = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime()
  const diff = Math.round((a - b) / 86400000)
  if (diff === 0) return 'Өнөөдөр'
  if (diff === 1) return 'Маргааш'
  return `${WEEKDAYS[d.getDay()]} ${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
}

export const LEVELS = { beginner: 'Анхан', intermediate: 'Дунд', advanced: 'Ахисан' }

export const MEMBERSHIP_STATUS = {
  pending: { label: 'Хүлээгдэж буй', cls: 'bg-amber-100 text-amber-800' },
  active: { label: 'Идэвхтэй', cls: 'bg-emerald-100 text-emerald-800' },
  expired: { label: 'Дууссан', cls: 'bg-ink-200 text-ink-700' },
  cancelled: { label: 'Цуцлагдсан', cls: 'bg-red-100 text-red-700' },
}

export const PAYMENT_STATUS = {
  pending: { label: 'Хүлээгдэж буй', cls: 'bg-amber-100 text-amber-800' },
  paid: { label: 'Төлөгдсөн', cls: 'bg-emerald-100 text-emerald-800' },
  failed: { label: 'Амжилтгүй', cls: 'bg-red-100 text-red-700' },
}

export const BOOKING_STATUS = {
  booked: { label: 'Бүртгэлтэй', cls: 'bg-tenger-100 text-tenger-800' },
  attended: { label: 'Ирсэн', cls: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'Цуцлагдсан', cls: 'bg-ink-200 text-ink-700' },
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
export const isPhone = (v) => /^[0-9+\-\s]{8,15}$/.test(v)
