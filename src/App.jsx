import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import AdminLayout from './components/AdminLayout'
import Home from './pages/Home'
import Classes from './pages/Classes'
import ClassDetail from './pages/ClassDetail'
import Plans from './pages/Plans'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Account from './pages/Account'
import MyBookings from './pages/MyBookings'
import PaymentSuccess from './pages/PaymentSuccess'
import NotFound from './pages/NotFound'
import Dashboard from './pages/admin/Dashboard'
import AdminClasses from './pages/admin/AdminClasses'
import AdminTrainers from './pages/admin/AdminTrainers'
import AdminClassTypes from './pages/admin/AdminClassTypes'
import AdminPlans from './pages/admin/AdminPlans'
import AdminUsers from './pages/admin/AdminUsers'
import AdminPayments from './pages/admin/AdminPayments'
import AdminCheckIn from './pages/admin/AdminCheckIn'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="classes" element={<Classes />} />
        <Route path="classes/:id" element={<ClassDetail />} />
        <Route path="plans" element={<Plans />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />

        <Route element={<ProtectedRoute />}>
          <Route path="account" element={<Account />} />
          <Route path="my-bookings" element={<MyBookings />} />
          <Route path="payment/success" element={<PaymentSuccess />} />
        </Route>

        <Route path="admin" element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="classes" element={<AdminClasses />} />
            <Route path="trainers" element={<AdminTrainers />} />
            <Route path="class-types" element={<AdminClassTypes />} />
            <Route path="plans" element={<AdminPlans />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="check-in" element={<AdminCheckIn />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
