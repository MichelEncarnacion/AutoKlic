import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabase'

export default function VendeTuAuto() {
  const [folio, setFolio] = useState(null)
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm()

  async function onSubmit(data) {
    const id = crypto.randomUUID()
    const { error } = await supabase
      .from('leads')
      .insert([{
        id,
        marca: data.marca,
        modelo: data.modelo,
        año: Number(data.año),
        kilometraje: Number(data.kilometraje),
        descripcion: data.descripcion || null,
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono,
      }])

    if (error) {
      alert('Ocurrió un error. Intenta de nuevo.')
      return
    }
    setFolio(id.substring(0, 8).toUpperCase())
    reset()
  }

  if (folio) {
    return (
      <section className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Solicitud enviada!</h2>
          <p className="text-gray-600 mb-4">Nos pondremos en contacto contigo pronto.</p>
          <p className="text-sm text-gray-500">Número de folio:</p>
          <p className="text-3xl font-mono font-bold text-green-700 tracking-widest mt-1">{folio}</p>
        </div>
      </section>
    )
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
  const errorClass = "text-red-500 text-xs mt-1"

  return (
    <section className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Vende tu Auto</h1>
      <p className="text-gray-500 mb-8">Completa el formulario y te contactamos con una oferta.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Section 1 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Tu auto</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca *</label>
              <input {...register('marca', { required: 'Requerido' })} className={inputClass} />
              {errors.marca && <p className={errorClass}>{errors.marca.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label>
              <input {...register('modelo', { required: 'Requerido' })} className={inputClass} />
              {errors.modelo && <p className={errorClass}>{errors.modelo.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Año *</label>
              <input type="number" {...register('año', { required: 'Requerido', min: { value: 1990, message: 'Mínimo 1990' }, max: { value: new Date().getFullYear(), message: 'No puede ser futuro' } })} className={inputClass} />
              {errors.año && <p className={errorClass}>{errors.año.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kilometraje *</label>
              <input type="number" {...register('kilometraje', { required: 'Requerido', min: { value: 0, message: 'Mínimo 0' } })} className={inputClass} />
              {errors.kilometraje && <p className={errorClass}>{errors.kilometraje.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
              <textarea rows={3} {...register('descripcion')} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Tus datos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
              <input {...register('nombre', { required: 'Requerido' })} className={inputClass} />
              {errors.nombre && <p className={errorClass}>{errors.nombre.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico *</label>
              <input type="email" {...register('email', { required: 'Requerido', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Correo inválido' } })} className={inputClass} />
              {errors.email && <p className={errorClass}>{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
              <input {...register('telefono', { required: 'Requerido' })} className={inputClass} />
              {errors.telefono && <p className={errorClass}>{errors.telefono.message}</p>}
            </div>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60">
          {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
        </button>
      </form>
    </section>
  )
}
