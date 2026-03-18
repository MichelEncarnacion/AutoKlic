import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>

  if (!user) return <Navigate to="/login" replace />

  if (requiredRole && profile?.role !== requiredRole) {
    toast.error('No tienes permiso para acceder a esta sección')
    return <Navigate to="/admin/inventario" replace />
  }

  return children
}
