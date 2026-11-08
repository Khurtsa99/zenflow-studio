import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PoseArt from './PoseArt'
import { LEVELS, formatMNT, formatTime, relativeDay } from '../lib/format'
import { poseFor, typeTheme } from '../lib/theme'

// Swipe хийдэг том постер карт. Өнгө нь ангийн төрлөөс хамаарна.
export default function ClassPoster({ cls }) {
  const type = cls.class_types
  const theme = typeTheme(type?.name)
  const left = cls.capacity - cls.booked_count
  const full = left <= 0
  const ratio = Math.min(1, cls.booked_count / cls.capacity)

  return (
    <motion.div
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="w-[78%] shrink-0 snap-start sm:w-72"
    >
      <Link
        to={`/classes/${cls.id}`}
        draggable={false}
        className="flex h-[27rem] flex-col justify-between overflow-hidden rounded-4xl p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
        style={{ backgroundColor: theme.bg, color: theme.fg }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display text-4xl font-semibold leading-none">{formatTime(cls.starts_at)}</p>
            <p className="mt-2 text-sm font-bold opacity-70">{relativeDay(cls.starts_at)}</p>
          </div>
          <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: theme.soft }}>{LEVELS[type?.level]}</span>
        </div>

        <div className="my-3 flex min-h-0 flex-1 items-center justify-center">
          {type?.image_url
            ? <img src={type.image_url} alt="" draggable={false} className="h-full w-full rounded-3xl object-cover" loading="lazy" />
            : <PoseArt pose={poseFor(type?.name)} color={theme.fg} className="h-full w-full" />}
        </div>

        <div>
          <h3 className="font-display text-xl font-semibold">{type?.name}</h3>
          <p className="mt-1 text-sm font-bold opacity-70">{cls.trainers?.name}</p>
          <div className="mt-4 flex items-center justify-between text-sm font-bold">
            <span>{full ? 'Дүүрсэн' : `${left} суудал`}</span>
            <span>{Number(cls.price) > 0 ? formatMNT(cls.price) : 'Багцад багтана'}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: theme.soft }} aria-hidden="true">
            <div className="h-full rounded-full" style={{ width: `${Math.max(6, ratio * 100)}%`, backgroundColor: theme.fg }} />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
