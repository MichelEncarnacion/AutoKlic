import { useForm } from 'react-hook-form'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const ROLE_LABELS = { admin: 'Administrador', seller: 'Vendedor', viewer: 'Visor' }
const ROLE_COLORS = { admin: 'bg-red-100 text-red-700', seller: 'bg-blue-100 text-blue-700', viewer: 'bg-gray-100 text-gray-600' }

export default function Perfil() {
  const { profile } = useAuth()
  const [savingName, setSavingName] = useState(false)
  const [savingPwd, setSavingPwd]   = useState(false)

  const {
    register: regName,
    handleSubmit: handleName,
    formState: { errors: nameErrors },
  } = useForm({ defaultValues: { nombre: profile?.nombre ?? '' } })

  const {
    register: regPwd,
    handleSubmit: handlePwd,
    formState: { errors: pwdErrors },
    watch,
    reset: resetPwd,
  } = useForm()

  async function onSaveName(data) {
    setSavingName(true)
    const { error } = await supabase.from('profiles').update({ nombre: data.nombre }).eq('id', profile.id)
    if (error) toast.error('Error al actualizar nombre')
    else toast.success('Nombre actualizado')
    setSavingName(false)
  }

  async function onSavePassword(data) {
    setSavingPwd(true)
    const { error } = await supabase.auth.updateUser({ password: data.newPassword })
    if (error) toast.error('Error al cambiar contraseña')
    else { toast.success('Contraseña actualizada'); resetPwd() }
    setSavingPwd(false)
  }

  const initial = (profile?.nombre ?? profile?.email ?? '?')[0].toUpperCase()

  const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all'
  const labelClass = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5'

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Mi perfil</h1>

      {/* Avatar card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-2xl font-bold text-red-600 shrink-0">
          {initial}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{profile?.nombre ?? '—'}</p>
          <p className="text-sm text-gray-400">{profile?.email}</p>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1.5 inline-block ${ROLE_COLORS[profile?.role]}`}>
            {ROLE_LABELS[profile?.role] ?? profile?.role}
          </span>
        </div>
      </div>

      {/* Update name */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="font-semibold text-gray-900 text-sm mb-4">Nombre</h2>
        <form onSubmit={handleName(onSaveName)} className="space-y-3">
          <div>
            <label className={labelClass}>Nombre completo</label>
            <input
              type="text"
              {...regName('nombre', { required: 'El nombre es requerido' })}
              className={inputClass}
              placeholder="Tu nombre completo"
            />
            {nameErrors.nombre && <p className="text-red-500 text-xs mt-1">{nameErrors.nombre.message}</p>}
          </div>
          <button
            type="submit"
            disabled={savingName}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            {savingName ? 'Guardando...' : 'Guardar nombre'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 text-sm mb-4">Cambiar contraseña</h2>
        <form onSubmit={handlePwd(onSavePassword)} className="space-y-3">
          <div>
            <label className={labelClass}>Nueva contraseña</label>
            <input
              type="password"
              {...regPwd('newPassword', {
                required: 'Requerido',
                minLength: { value: 6, message: 'Mínimo 6 caracteres' },
              })}
              className={inputClass}
              placeholder="Mínimo 6 caracteres"
            />
            {pwdErrors.newPassword && <p className="text-red-500 text-xs mt-1">{pwdErrors.newPassword.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Confirmar contraseña</label>
            <input
              type="password"
              {...regPwd('confirm', {
                required: 'Requerido',
                validate: v => v === watch('newPassword') || 'Las contraseñas no coinciden',
              })}
              className={inputClass}
              placeholder="Repite la contraseña"
            />
            {pwdErrors.confirm && <p className="text-red-500 text-xs mt-1">{pwdErrors.confirm.message}</p>}
          </div>
          <button
            type="submit"
            disabled={savingPwd}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            {savingPwd ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
