import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/admin', label: 'Самбар', end: true },
  { to: '/admin/classes', label: 'Ангиуд' },
  { to: '/admin/class-types', label: 'Ангийн төрөл' },
  { to: '/admin/trainers', label: 'Дасгалжуулагч' },
  { to: '/admin/plans', label: 'Багцууд' },
  { to: '/admin/users', label: 'Хэрэглэгчид' },
  { to: '/admin/payments', label: 'Төлбөр' },
  { to: '/admin/check-in', label: 'Ирц (QR)' },
]

export default function AdminLayout() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-5 font-display text-2xl font-semibold text-ink-900">Админ самбар</h1>
      <nav className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="Админ цэс">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `chip ${isActive ? 'chip-active' : ''}`}>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
