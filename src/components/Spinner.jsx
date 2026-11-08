export default function Spinner({ label = 'Ачаалж байна...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-ink-500" role="status">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-tenger-600 border-t-transparent" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}
