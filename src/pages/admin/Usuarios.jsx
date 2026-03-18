import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'

const ROLES = ['admin', 'seller', 'viewer']
const ROLE_LABELS = { admin: 'Admin', seller: 'Vendedor', viewer: 'Visor' }

export default function Usuarios() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('profiles').select('*').order('email').then(({ data }) => {
      setUsers(data ?? [])
      setLoading(false)
    })
  }, [])

  async function updateRole(id, role) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
    if (error) toast.error('Error al actualizar rol')
    else {
      toast.success('Rol actualizado')
      setUsers(u => u.map(x => x.id === id ? { ...x, role } : x))
    }
  }

  function showInviteInstructions() {
    toast('Para invitar un usuario: Supabase dashboard → Authentication → Users → Invite user', { duration: 6000 })
  }

  async function sendPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) toast.error('Error al enviar correo')
    else toast.success('Correo de restablecimiento enviado')
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Usuarios</h1>
        <button onClick={showInviteInstructions}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
          + Invitar usuario
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rol</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">{user.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="px-4 py-3">
                    <select value={user.role} onChange={e => updateRole(user.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => sendPasswordReset(user.email)}
                        className="text-xs text-blue-600 hover:underline">
                        Restablecer contraseña
                      </button>
                      <button disabled title="Gestionar en Supabase Dashboard"
                        className="text-xs text-gray-300 cursor-not-allowed">
                        Desactivar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={4} className="text-center py-12 text-gray-400">No hay usuarios</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
