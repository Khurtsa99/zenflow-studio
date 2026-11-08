// page нь 0-ээс эхэлнэ
export default function Pagination({ page, pageSize, total, onChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (total <= pageSize) return null
  return (
    <div className="mt-6 flex items-center justify-between gap-3 text-sm">
      <span className="text-ink-500">
        Нийт {total} · {page + 1} / {pages} хуудас
      </span>
      <div className="flex gap-2">
        <button className="btn-outline" disabled={page === 0} onClick={() => onChange(page - 1)}>
          ← Өмнөх
        </button>
        <button className="btn-outline" disabled={page + 1 >= pages} onClick={() => onChange(page + 1)}>
          Дараах →
        </button>
      </div>
    </div>
  )
}
