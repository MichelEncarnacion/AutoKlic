// src/pages/admin/Usuarios.jsx
import { useEffect, useState } from 'react'
import { XMarkIcon, UserPlusIcon, TrashIcon, NoSymbolIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'

const ROLES = ['admin', 'seller', 'viewer']
const ROLE_LABELS = { admin: 'Admin', seller: 'Vendedor', viewer: 'Visor' }
const ROLE_COLORS = {
  admin:  'bg-red-100 text-red-700',
  seller: 'bg-blue-100 text-blue-700',
  viewer: 'bg-gray-100 text-gray-600',
}

const EMPTY_FORM = { nombre: '', email: '', password: '', role: 'viewer' }

export default function Usuarios() {
  const [users, setUsers]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)

  const { user: currentUser } = useAuth()
  const [activeFilter, setActiveFilter]   = useState('active') // 'all' | 'active' | 'inactive'
  const [confirmDelete, setConfirmDelete] = useState(null)     // user object | null
  const [toggling, setToggling]           = useState(null)     // userId being toggled | null
  const [deleting, setDeleting]           = useState(false)

  const filtered = users.filter(u => {
    if (activeFilter === 'active')   return u.active !== false  // treat undefined as active
    if (activeFilter === 'inactive') return u.active === false
    return true
  })

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      toast.error('Sesión expirada, vuelve a iniciar sesión')
      return null
    }
    return session.access_token
  }

  async function toggleActive(u) {
    const token = await getToken()
    if (!token) return
    setToggling(u.id)
    try {
      const newActive = u.active === false
      const res = await fetch('/api/toggle-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: u.id, active: newActive }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error ?? 'Error al actualizar usuario')
      } else {
        toast.success(newActive ? 'Usuario reactivado' : 'Usuario desactivado')
        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, active: result.active } : x))
      }
    } finally {
      setToggling(null)
    }
  }

  async function confirmAndDelete() {
    if (!confirmDelete) return
    const token = await getToken()
    if (!token) { setConfirmDelete(null); return }
    setDeleting(true)
    try {
      const res = await fetch('/api/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: confirmDelete.id }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error ?? 'Error al eliminar usuario')
      } else {
        toast.success('Usuario eliminado permanentemente')
        setUsers(prev => prev.filter(x => x.id !== confirmDelete.id))
      }
    } finally {
      setDeleting(false)
      setConfirmDelete(null)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('email')
    setUsers(data ?? [])
    setLoading(false)
  }

  async function updateRole(id, role) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
    if (error) toast.error('Error al actualizar rol')
    else {
      toast.success('Rol actualizado')
      setUsers(u => u.map(x => x.id === id ? { ...x, role } : x))
    }
  }

  async function sendPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) toast.error('Error al enviar correo')
    else toast.success('Correo de restablecimiento enviado')
  }

  async function handleCreateUser(e) {
    e.preventDefault()
    setSaving(true)

    const token = await getToken()
    if (!token) { setSaving(false); return }

    const res = await fetch('/api/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    })

    const result = await res.json()

    if (!res.ok) {
      toast.error(result.error ?? 'Error al crear usuario')
      setSaving(false)
      return
    }

    toast.success(`Usuario ${result.email} creado correctamente`)
    setUsers(prev => [...prev, result])
    setForm(EMPTY_FORM)
    setShowModal(false)
    setSaving(false)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-400 mt-0.5">{filtered.length} de {users.length} usuario{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          <UserPlusIcon className="h-4 w-4" />
          Crear usuario
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Filter tabs */}
          <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
            {[
              { key: 'active',   label: 'Activos' },
              { key: 'inactive', label: 'Inactivos' },
              { key: 'all',      label: 'Todos' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                  activeFilter === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
              <table className="w-full text-sm min-w-[500px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rol</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400">
                        {activeFilter !== 'all' ? 'No hay usuarios en esta categoría' : 'No hay usuarios registrados'}
                      </td>
                    </tr>
                  ) : filtered.map(user => {
                    const isInactive = user.active === false
                    const isSelf     = user.id === currentUser?.id
                    return (
                      <tr key={user.id} className={`hover:bg-gray-50 transition ${isInactive ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3 font-medium text-gray-900">{user.nombre ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{user.email}</td>
                        <td className="px-4 py-3">
                          <select
                            value={user.role}
                            onChange={e => updateRole(user.id, e.target.value)}
                            disabled={isInactive}
                            className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-red-500/30 cursor-pointer disabled:cursor-not-allowed ${ROLE_COLORS[user.role]}`}
                          >
                            {ROLES.map(r => (
                              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          {isInactive ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                              <NoSymbolIcon className="w-3 h-3" /> Inactivo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                              <CheckCircleIcon className="w-3 h-3" /> Activo
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            {!isSelf && (
                              <button
                                onClick={() => toggleActive(user)}
                                disabled={toggling === user.id}
                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors disabled:opacity-50"
                              >
                                {toggling === user.id ? '...' : isInactive ? 'Activar' : 'Desactivar'}
                              </button>
                            )}
                            <button
                              onClick={() => sendPasswordReset(user.email)}
                              className="text-xs text-gray-500 hover:text-gray-800 hover:underline transition-colors"
                            >
                              Restablecer contraseña
                            </button>
                            {!isSelf && (
                              <button
                                onClick={() => setConfirmDelete(user)}
                                className="p-1 text-gray-300 hover:text-red-500 transition"
                                title="Eliminar permanentemente"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            {/* Modal header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Crear nuevo usuario</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  required
                  placeholder="correo@ejemplo.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Contraseña temporal
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all"
                />
                <p className="text-xs text-gray-400 mt-1">El usuario podrá cambiarla desde su perfil.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Rol
                </label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all bg-white"
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
                <div className="mt-2 text-xs text-gray-400 space-y-0.5">
                  <p><span className="font-semibold text-gray-600">Admin:</span> acceso total</p>
                  <p><span className="font-semibold text-gray-600">Vendedor:</span> gestiona inventario y leads</p>
                  <p><span className="font-semibold text-gray-600">Visor:</span> solo lectura</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl text-sm font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                >
                  {saving ? 'Creando...' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">¿Eliminar usuario?</h2>
              <button
                onClick={() => setConfirmDelete(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-1">
              Esta acción es <strong>permanente e irreversible</strong>.
            </p>
            <p className="text-sm font-medium text-gray-800 mb-6">
              {confirmDelete.nombre ?? confirmDelete.email}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl text-sm font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAndDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition"
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
