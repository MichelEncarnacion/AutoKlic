import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  ArchiveBoxIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline'

const navItems = [
  { to: '/admin/inventario', label: 'Inventario', icon: ArchiveBoxIcon },
  { to: '/admin/leads', label: 'Leads', icon: UserGroupIcon },
  { to: '/admin/reportes', label: 'Reportes', icon: ChartBarIcon },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <p className="font-bold text-gray-900 text-lg">AutoKlic</p>
          <p className="text-xs text-gray-400">Panel de administración</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {/* eslint-disable-next-line no-unused-vars */}
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                }`
              }>
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}

          {profile?.role === 'admin' && (
            <NavLink to="/admin/usuarios"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                }`
              }>
              <DocumentChartBarIcon className="w-5 h-5" />
              Usuarios
            </NavLink>
          )}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <NavLink to="/admin/ayuda"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition mb-1 ${
                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
              }`
            }>
            <QuestionMarkCircleIcon className="w-5 h-5" />
            Ayuda
          </NavLink>
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium text-gray-700 truncate">{profile?.nombre}</p>
            <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
          </div>
          <button onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
