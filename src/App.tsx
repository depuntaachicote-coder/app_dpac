import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useEffect, lazy, Suspense } from 'react'
import { trackEvent } from './hooks/useAnalytics'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
    trackEvent({ event_type: 'page_view', page_path: pathname })
  }, [pathname])
  return null
}

// Layouts (cargados siempre — son pequeños y compartidos)
import MainLayout from './layouts/MainLayout'
import DashboardLayout from './layouts/DashboardLayout'
import AdminLayout from './layouts/AdminLayout'

// Auth Provider
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoadingSpinner from './components/ui/LoadingSpinner'
import CookieBanner from './components/ui/CookieBanner'

// Public Pages — lazy loaded
const Landing = lazy(() => import('./pages/Landing'))
const LandingAnfitrion = lazy(() => import('./pages/LandingAnfitrion'))
const Ranking = lazy(() => import('./pages/Ranking'))
const Tarifas = lazy(() => import('./pages/Tarifas'))
const Terminos = lazy(() => import('./pages/Terminos'))
const PropertyDetail = lazy(() => import('./pages/PropertyDetail'))
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const AuthCallback = lazy(() => import('./pages/auth/AuthCallback'))

// User Dashboard Pages — lazy loaded
const UserFavorites = lazy(() => import('./pages/dashboard/UserFavorites'))
const UserDashboard = lazy(() => import('./pages/dashboard/UserDashboard'))
const UserMedia = lazy(() => import('./pages/dashboard/UserMedia'))
const UserBudgets = lazy(() => import('./pages/dashboard/UserBudgets'))
const UserInvoices = lazy(() => import('./pages/dashboard/UserInvoices'))
const UserProfile = lazy(() => import('./pages/dashboard/UserProfile'))
const UserPropertyEdit = lazy(() => import('./pages/dashboard/UserPropertyEdit'))
const UserProperties = lazy(() => import('./pages/dashboard/UserProperties'))
const UserPropertyDetail = lazy(() => import('./pages/dashboard/UserPropertyDetail'))

// Booking Pages — lazy loaded
const Checkout = lazy(() => import('./pages/Checkout'))
const BookingConfirmation = lazy(() => import('./pages/BookingConfirmation'))
const UserBookings = lazy(() => import('./pages/UserBookings'))
const BookingDetail = lazy(() => import('./pages/BookingDetail'))

// Host Pages — lazy loaded
const HostBookings = lazy(() => import('./pages/HostBookings'))
const HostCalendar = lazy(() => import('./pages/HostCalendar'))
const HostAvailabilityManager = lazy(() => import('./pages/dashboard/HostAvailabilityManager'))

// Admin Pages — lazy loaded (chunk separado)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminProperties = lazy(() => import('./pages/admin/AdminProperties'))
const AdminPropertyEdit = lazy(() => import('./pages/admin/AdminPropertyEdit'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminMedia = lazy(() => import('./pages/admin/AdminMedia'))
const AdminSocial = lazy(() => import('./pages/admin/AdminSocial'))
const AdminCRM = lazy(() => import('./pages/admin/AdminCRM'))
const AdminCalendar = lazy(() => import('./pages/admin/AdminCalendar'))
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'))
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings'))
const AdminTarifas = lazy(() => import('./pages/admin/AdminTarifas'))
const AdminEmailMarketing = lazy(() => import('./pages/admin/AdminEmailMarketing'))
const AdminFacturas = lazy(() => import('./pages/admin/AdminFacturas'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <LoadingSpinner size="lg" />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <CookieBanner />
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          <Routes>
            {/* Auth Callback - Sin layout */}
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Public Routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/anfitrion" element={<LandingAnfitrion />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/tarifas" element={<Tarifas />} />
              <Route path="/hospedaje/:id" element={<PropertyDetail />} />
              <Route path="/property/:id" element={<PropertyDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Register />} />
              <Route path="/terminos" element={<Terminos />} />
              <Route path="/privacidad" element={<Terminos />} />
            </Route>

            {/* Booking Routes (Protected) */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/booking-confirmation/:bookingId" element={<BookingConfirmation />} />
            </Route>

            {/* User Dashboard Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/dashboard/bookings" element={<UserBookings />} />
              <Route path="/dashboard/bookings/:bookingId" element={<BookingDetail />} />
              <Route path="/dashboard/favoritos" element={<UserFavorites />} />
              <Route path="/dashboard/media" element={<UserMedia />} />
              <Route path="/dashboard/presupuestos" element={<UserBudgets />} />
              <Route path="/dashboard/facturas" element={<UserInvoices />} />
              <Route path="/dashboard/perfil" element={<UserProfile />} />
              <Route path="/dashboard/propiedad" element={<UserPropertyEdit />} />
              <Route path="/dashboard/propiedades" element={<UserProperties />} />
              <Route path="/dashboard/propiedades/:id" element={<UserPropertyDetail />} />
              <Route path="/dashboard/disponibilidad" element={<HostAvailabilityManager />} />
            </Route>

            {/* Host Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/host/bookings" element={<HostBookings />} />
              <Route path="/host/calendar" element={<HostCalendar />} />
            </Route>

            {/* Admin Routes */}
            <Route
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/propiedades" element={<AdminProperties />} />
              <Route path="/admin/propiedades/nueva" element={<AdminPropertyEdit />} />
              <Route path="/admin/propiedades/:id" element={<AdminPropertyEdit />} />
              <Route path="/admin/usuarios" element={<AdminUsers />} />
              <Route path="/admin/bookings" element={<AdminBookings />} />
              <Route path="/admin/media" element={<AdminMedia />} />
              <Route path="/admin/social" element={<AdminSocial />} />
              <Route path="/admin/crm" element={<AdminCRM />} />
              <Route path="/admin/calendario" element={<AdminCalendar />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/tarifas" element={<AdminTarifas />} />
              <Route path="/admin/email-marketing" element={<AdminEmailMarketing />} />
              <Route path="/admin/facturas" element={<AdminFacturas />} />
            </Route>

            {/* Super Admin Only Routes */}
            <Route
              element={
                <ProtectedRoute requireAdmin requireSuperAdmin>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/admin/ajustes" element={<AdminSettings />} />
            </Route>
          </Routes>
        </AnimatePresence>
      </Suspense>
    </AuthProvider>
  )
}

export default App
