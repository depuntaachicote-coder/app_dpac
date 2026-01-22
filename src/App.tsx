import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

// Layouts
import MainLayout from './layouts/MainLayout'
import DashboardLayout from './layouts/DashboardLayout'
import AdminLayout from './layouts/AdminLayout'

// Public Pages
import Landing from './pages/Landing'
import Ranking from './pages/Ranking'
import PropertyDetail from './pages/PropertyDetail'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// User Dashboard Pages
import UserDashboard from './pages/dashboard/UserDashboard'
import UserMedia from './pages/dashboard/UserMedia'
import UserBudgets from './pages/dashboard/UserBudgets'
import UserInvoices from './pages/dashboard/UserInvoices'
import UserProfile from './pages/dashboard/UserProfile'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProperties from './pages/admin/AdminProperties'
import AdminPropertyEdit from './pages/admin/AdminPropertyEdit'
import AdminUsers from './pages/admin/AdminUsers'
import AdminMedia from './pages/admin/AdminMedia'
import AdminSocial from './pages/admin/AdminSocial'

// Auth Provider
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public Routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/hospedaje/:id" element={<PropertyDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />
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
            <Route path="/dashboard/media" element={<UserMedia />} />
            <Route path="/dashboard/presupuestos" element={<UserBudgets />} />
            <Route path="/dashboard/facturas" element={<UserInvoices />} />
            <Route path="/dashboard/perfil" element={<UserProfile />} />
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
            <Route path="/admin/media" element={<AdminMedia />} />
            <Route path="/admin/social" element={<AdminSocial />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </AuthProvider>
  )
}

export default App
