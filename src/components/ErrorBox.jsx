import Icon from './Icon'

export default function ErrorBox({ message = 'Алдаа гарлаа', onRetry }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center" role="alert">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600">
        <Icon name="alert" size={22} />
      </div>
      <p className="text-sm font-semibold text-red-800">{message}</p>
      {onRetry && (
        <button className="btn-outline mt-4" onClick={onRetry}>
          Дахин оролдох
        </button>
      )}
    </div>
  )
}
