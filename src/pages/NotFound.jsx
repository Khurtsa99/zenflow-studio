import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-6xl font-bold text-tenger-700">404</p>
      <h1 className="mt-4 text-xl font-semibold">Хуудас олдсонгүй</h1>
      <p className="mt-2 text-sm text-ink-500">Таны хайсан хуудас байхгүй эсвэл зөөгдсөн байна.</p>
      <Link to="/" className="btn-primary mt-6">Нүүр хуудас руу буцах</Link>
    </div>
  )
}
