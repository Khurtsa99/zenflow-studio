import Icon from './Icon'

export default function EmptyState({ title = 'Илэрц олдсонгүй', text, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink-200 bg-white/60 px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-tenger-50 text-tenger-600">
        <Icon name="search" size={22} />
      </div>
      <h3 className="font-display text-base font-medium text-ink-900">{title}</h3>
      {text && <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
