// src/pages/admin/AdminLayout.jsx
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  ArchiveBoxIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  QuestionMarkCircleIcon,
  Bars3Icon,
  XMarkIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline'

const navItems = [
  { to: '/admin/dashboard',  label: 'Dashboard',  icon: Squares2X2Icon },
  { to: '/admin/inventario', label: 'Inventario', icon: ArchiveBoxIcon },
  { to: '/admin/leads',      label: 'Leads',       icon: UserGroupIcon },
  { to: '/admin/reportes',   label: 'Reportes',    icon: ChartBarIcon },
]

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
    isActive ? 'bg-red-50 text-red-700' : 'text-gray-600 hover:bg-gray-50'
  }`

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-900 text-lg leading-none">AutoKlic</p>
          <p className="text-xs text-gray-400 mt-0.5">Panel de administración</p>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={linkClass} onClick={() => setOpen(false)}>
            <Icon className="w-5 h-5 shrink-0" />
            {label}
          </NavLink>
        ))}
        {profile?.role === 'admin' && (
          <NavLink to="/admin/usuarios" className={linkClass} onClick={() => setOpen(false)}>
            <DocumentChartBarIcon className="w-5 h-5 shrink-0" />
            Usuarios
          </NavLink>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        <NavLink to="/admin/ayuda" className={linkClass} onClick={() => setOpen(false)}>
          <QuestionMarkCircleIcon className="w-5 h-5 shrink-0" />
          Ayuda
        </NavLink>
        <div className="px-3 py-2">
          <p className="text-xs font-medium text-gray-700 truncate">{profile?.nombre}</p>
          <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col w-60 bg-white border-r border-gray-200 shrink-0">
        <SidebarContent />
      </aside>

      {/* ── Mobile drawer backdrop ───────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile drawer ───────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* ── Main ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            aria-label="Abrir menú"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
          <span className="font-bold text-gray-900">AutoKlic Admin</span>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
