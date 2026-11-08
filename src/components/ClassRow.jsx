import { Link } from 'react-router-dom'
import PoseArt from './PoseArt'
import { LEVELS, formatMNT, formatTime } from '../lib/format'
import { poseFor, typeTheme } from '../lib/theme'

// Хуваарийн нэг мөр: цаг нь хамгийн том, дараа нь анги, дасгалжуулагч, суудал.
export default function ClassRow({ cls }) {
  const type = cls.class_types
  const theme = typeTheme(type?.name)
  const left = cls.capacity - cls.booked_count
  const full = left <= 0
  const ratio = Math.min(1, cls.booked_count / cls.capacity)
  const barColor = full ? 'bg-ink-400' : ratio >= 0.75 ? 'bg-saffron' : 'bg-tenger-500'

  return (
    <Link
      to={`/classes/${cls.id}`}
      className="group grid grid-cols-[4.25rem_1fr_auto] items-center gap-3 rounded-3xl border border-ink-100 bg-white px-4 py-3.5 transition hover:border-tenger-300 hover:bg-tenger-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenger-500 sm:grid-cols-[5.5rem_3.5rem_1fr_auto] sm:gap-4 sm:px-5"
    >
      <div>
        <p className="font-display text-xl font-semibold leading-none text-ink-900 sm:text-2xl">{formatTime(cls.starts_at)}</p>
        <p className="mt-1.5 text-xs text-ink-500">{cls.duration_min} мин</p>
      </div>

      <div className="hidden h-14 w-14 items-center justify-center overflow-hidden rounded-2xl sm:flex" style={{ backgroundColor: theme.bg }}>
        {type?.image_url
          ? <img src={type.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
          : <PoseArt pose={poseFor(type?.name)} color={theme.fg} className="h-full w-full p-1" />}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-semibold text-ink-900">{type?.name}</h3>
          <span className="badge bg-ink-100 text-ink-600">{LEVELS[type?.level]}</span>
        </div>
        <p className="mt-0.5 truncate text-sm text-ink-500">{cls.trainers?.name}</p>
      </div>

      <div className="w-24 text-right sm:w-28">
        <p className={`text-sm font-semibold ${full ? 'text-ink-500' : 'text-ink-900'}`}>{full ? 'Дүүрсэн' : `${left} суудал`}</p>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-100" aria-hidden="true">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.max(6, ratio * 100)}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-ink-500">{Number(cls.price) > 0 ? formatMNT(cls.price) : 'Багцад багтана'}</p>
      </div>
    </Link>
  )
}
