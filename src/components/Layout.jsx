import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import Icon from './Icon'

function Logo({ light = false }) {
  return (
    <span className={`flex items-center gap-2 font-display text-base font-semibold ${light ? 'text-white' : 'text-ink-900'}`}>
      <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill={light ? '#1D5BD8' : '#DDE9FF'} />
        <circle cx="12" cy="12" r="6" fill={light ? '#F4B63F' : '#1D5BD8'} />
      </svg>
      ZenFlow
    </span>
  )
}

export default function Layout() {
  const { session, profile, isAdmin, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const outlet = useOutlet()
  const { pathname } = useLocation()
  // /admin доторх шилжилтэд бүхэл хуудас дахин анимаци хийхгүй
  const pageKey = pathname.startsWith('/admin') ? '/admin' : pathname

  useEffect(() => { window.scrollTo(0, 0) }, [pageKey])
  const initial = (profile?.full_name || session?.user?.email || '?').trim().charAt(0).toUpperCase()

  const NavItem = ({ to, children, pill }) => (
    <NavLink to={to} onClick={() => setOpen(false)} className={({ isActive }) => `relative rounded-full px-4 py-2 text-sm font-semibold transition-colors ${isActive ? 'text-tenger-700' : 'text-ink-600 hover:text-ink-900'}`}>
      {({ isActive }) => (
        <>
          {isActive && <motion.span layoutId={pill} className="absolute inset-0 rounded-full bg-tenger-50" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
          <span className="relative">{children}</span>
        </>
      )}
    </NavLink>
  )

  async function handleSignOut() {
    await signOut()
    setOpen(false)
    toast.success('Системээс гарлаа')
    navigate('/')
  }

  const close = () => setOpen(false)
  const items = (pill) => (
    <>
      <NavItem to="/classes" pill={pill}>Ангиуд</NavItem>
      <NavItem to="/plans" pill={pill}>Гишүүнчлэл</NavItem>
      {session && <NavItem to="/my-bookings" pill={pill}>Миний захиалга</NavItem>}
      {session && <NavItem to="/account" pill={pill}>Данс</NavItem>}
      {isAdmin && <NavItem to="/admin" pill={pill}>Админ</NavItem>}
    </>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 px-3 pt-3">
        <div className="relative mx-auto max-w-6xl">
          <div className="flex items-center justify-between rounded-full border border-ink-100 bg-white/85 py-2 pl-5 pr-2 shadow-[0_10px_30px_-14px_rgba(14,27,51,0.3)] backdrop-blur-md">
            <Link to="/" onClick={close} aria-label="ZenFlow нүүр хуудас"><Logo /></Link>

            <nav className="hidden items-center gap-1 md:flex">{items('nav-pill')}</nav>

            <div className="hidden items-center gap-2 md:flex">
              {session ? (
                <>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-saffron font-display text-sm font-semibold text-ink-900" title={profile?.full_name || session.user.email}>{initial}</span>
                  <button className="btn-outline py-2" onClick={handleSignOut}>Гарах</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn py-2 text-ink-700 hover:bg-ink-50">Нэвтрэх</Link>
                  <Link to="/register" className="btn-primary py-2">Бүртгүүлэх</Link>
                </>
              )}
            </div>

            <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-ink-50 md:hidden" onClick={() => setOpen(!open)} aria-label={open ? 'Цэс хаах' : 'Цэс нээх'} aria-expanded={open}>
              <Icon name={open ? 'x' : 'menu'} size={22} />
            </button>
          </div>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                className="absolute left-0 right-0 top-full mt-2 flex origin-top flex-col gap-1 rounded-3xl border border-ink-100 bg-white p-3 shadow-xl md:hidden"
              >
                {items('nav-pill-m')}
                {session ? (
                  <button className="btn-outline mt-2" onClick={handleSignOut}>Гарах</button>
                ) : (
                  <div className="mt-2 flex gap-2">
                    <Link to="/login" className="btn-outline flex-1" onClick={close}>Нэвтрэх</Link>
                    <Link to="/register" className="btn-primary flex-1" onClick={close}>Бүртгүүлэх</Link>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main className="flex-1 overflow-x-clip">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pageKey}
            initial={{ opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -48 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="mt-20 rounded-t-[2.5rem] bg-ink-900 px-6 py-12 text-ink-300">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo light />
            <p className="mt-4 max-w-xs text-sm leading-relaxed">Йога, Pilates, HIIT ангийн бүртгэл, гишүүнчлэл, ирцийг нэг дор.</p>
          </div>
          <nav className="flex flex-col gap-2 text-sm" aria-label="Хуудсууд">
            <Link to="/classes" className="hover:text-white">Ангийн хуваарь</Link>
            <Link to="/plans" className="hover:text-white">Гишүүнчлэлийн багц</Link>
            {session ? <Link to="/my-bookings" className="hover:text-white">Миний захиалга</Link> : <Link to="/login" className="hover:text-white">Нэвтрэх</Link>}
          </nav>
          <p className="text-sm text-ink-400">© {new Date().getFullYear()} ZenFlow Studio</p>
        </div>
        <p className="mx-auto mt-12 max-w-6xl select-none overflow-hidden font-display text-[22vw] font-semibold leading-[0.8] tracking-tight text-white/[0.06] md:text-[14rem]" aria-hidden="true">ZenFlow</p>
      </footer>
    </div>
  )
}
