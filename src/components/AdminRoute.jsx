import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from './Spinner'

// Зөвхөн админ эрхтэй хэрэглэгч нэвтэрнэ. (Бодит хамгаалалтыг RLS хийдэг, энэ нь UI түвшний хамгаалалт.)
export default function AdminRoute() {
  const { session, isAdmin, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Spinner />
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />
  if (!isAdmin) return <Navigate to="/" replace />
  return <Outlet />
}
