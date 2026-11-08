import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from './Spinner'

export default function ProtectedRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Spinner />
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}
