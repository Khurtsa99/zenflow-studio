import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from './Icon'

// Хөндлөн swipe: утсан дээр хуруугаар шургуулна, компьютер дээр хулганаар чирнэ, сумаар шилжүүлнэ.
export default function Carousel({ children, dark = false, label = 'Жагсаалт' }) {
  const ref = useRef(null)
  const drag = useRef({ down: false, startX: 0, startLeft: 0, moved: false })
  const [progress, setProgress] = useState(0)
  const [edges, setEdges] = useState({ start: true, end: false })

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setProgress(max > 0 ? el.scrollLeft / max : 0)
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft >= max - 4 })
  }, [])

  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [update, children])

  function onPointerDown(e) {
    if (e.pointerType !== 'mouse') return
    const el = ref.current
    drag.current = { down: true, startX: e.clientX, startLeft: el.scrollLeft, moved: false }
  }
  function onPointerMove(e) {
    const d = drag.current
    if (!d.down) return
    const dx = e.clientX - d.startX
    if (Math.abs(dx) > 6) {
      d.moved = true
      ref.current.classList.add('is-dragging')
    }
    if (d.moved) ref.current.scrollLeft = d.startLeft - dx
  }
  function endDrag() {
    drag.current.down = false
    ref.current?.classList.remove('is-dragging')
  }
  function onClickCapture(e) {
    if (drag.current.moved) {
      e.preventDefault()
      e.stopPropagation()
      drag.current.moved = false
    }
  }
  function go(dir) {
    const el = ref.current
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  const btn = `flex h-11 w-11 items-center justify-center rounded-full border transition active:scale-95 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron ${dark ? 'border-white/25 text-white hover:bg-white/10' : 'border-ink-200 bg-white text-ink-800 hover:bg-ink-50'}`

  return (
    <div>
      <div
        ref={ref}
        role="region"
        aria-label={label}
        onScroll={update}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={onClickCapture}
        onDragStart={(e) => e.preventDefault()}
        className="no-scrollbar -mx-6 flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 [scroll-padding-left:1.5rem]"
      >
        {children}
      </div>
      <div className="mt-6 flex items-center justify-between gap-6">
        <div className={`h-1 w-32 overflow-hidden rounded-full ${dark ? 'bg-white/15' : 'bg-ink-200'}`} aria-hidden="true">
          <div className={`h-full rounded-full ${dark ? 'bg-saffron' : 'bg-tenger-600'}`} style={{ width: `${25 + progress * 75}%` }} />
        </div>
        <div className="flex gap-2">
          <button type="button" className={btn} onClick={() => go(-1)} disabled={edges.start} aria-label="Өмнөх"><Icon name="arrow" size={18} className="rotate-180" /></button>
          <button type="button" className={btn} onClick={() => go(1)} disabled={edges.end} aria-label="Дараах"><Icon name="arrow" size={18} /></button>
        </div>
      </div>
    </div>
  )
}
