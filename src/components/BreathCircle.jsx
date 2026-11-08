import { useEffect, useState } from 'react'

const PHASES = [
  { label: 'Амьсгалаа аваарай', ms: 4000, scale: 1 },
  { label: 'Аажуухан гаргаарай', ms: 6000, scale: 0.6 },
]

// Нүүр хуудасны гол элемент: амьсгалын хэмнэлийг заадаг дугуй.
// 4 секунд амьсгал авч, 6 секунд гаргана.
export default function BreathCircle() {
  const [idx, setIdx] = useState(0)
  const [started, setStarted] = useState(false)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), 60)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (paused) return
    const t = setTimeout(() => setIdx((i) => (i + 1) % PHASES.length), PHASES[idx].ms)
    return () => clearTimeout(t)
  }, [idx, paused])

  const phase = PHASES[idx]
  const scale = started && !paused ? phase.scale : paused ? 0.8 : 0.6
  const transition = started && !paused ? `transform ${phase.ms}ms ease-in-out` : 'transform 600ms ease-out'

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="relative mx-auto aspect-square w-full" role="img" aria-label="Амьсгалын хэмнэл заагч дугуй">
        <div className="absolute inset-0 rounded-full bg-tenger-100" />
        <div className="absolute inset-[11%] rounded-full bg-tenger-200/70" />
        <div className="absolute inset-[22%] rounded-full bg-tenger-300/60" />
        <div
          className="absolute inset-[16%] flex items-center justify-center rounded-full bg-tenger-600 will-change-transform"
          style={{ transform: `scale(${scale})`, transition }}
        />
        <div className="absolute inset-0 flex items-center justify-center px-8 text-center">
          <span className="font-display text-lg font-medium leading-snug text-white sm:text-xl">
            {paused ? 'Түр зогсов' : phase.label}
          </span>
        </div>
        <span className="absolute right-[7%] top-[9%] h-5 w-5 rounded-full bg-saffron" />
      </div>
      <div className="mt-5 flex items-center justify-center gap-3 text-sm text-ink-600">
        <span>Нэг амьсгал 10 секунд</span>
        <button type="button" onClick={() => setPaused((p) => !p)} className="rounded-full border border-ink-200 bg-white px-3 py-1 font-semibold text-ink-700 transition hover:border-ink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenger-500">
          {paused ? 'Үргэлжлүүлэх' : 'Зогсоох'}
        </button>
      </div>
    </div>
  )
}
