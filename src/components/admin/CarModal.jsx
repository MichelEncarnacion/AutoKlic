import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { XMarkIcon } from '@heroicons/react/24/outline'

const TRANSMISIONES = ['Manual', 'Automática']
const COMBUSTIBLES = ['Gasolina', 'Diésel', 'Híbrido', 'Eléctrico']
const STATUSES = [
  { value: 'available', label: 'Disponible' },
  { value: 'sold', label: 'Vendido' },
  { value: 'reserved', label: 'Reservado' },
]

export default function CarModal({ car, onClose, onSaved }) {
  const isEdit = Boolean(car)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: car ? {
      ...car,
      aire: car.aire ? 'true' : 'false',
    } : { status: 'available', visible: true }
  })

  const [images, setImages] = useState(car?.imagenes ?? [])
  const [draggingIdx, setDraggingIdx] = useState(null)
  const [uploading, setUploading] = useState(false)

  function pathFromUrl(url) {
    const marker = '/car-images/'
    const idx = url.indexOf(marker)
    return idx >= 0 ? url.substring(idx + marker.length) : null
  }

  async function handleImageFiles(e) {
    const files = Array.from(e.target.files)
    if (images.length + files.length > 10) {
      toast.error('Máximo 10 imágenes por auto')
      return
    }
    setUploading(true)
    const carId = car?.id ?? crypto.randomUUID()
    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error(`${file.name}: formato no permitido`)
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: máximo 5MB`)
        continue
      }
      const path = `${carId}/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('car-images').upload(path, file)
      if (error) {
        toast.error(`Error subiendo ${file.name}`)
        continue
      }
      const { data: { publicUrl } } = supabase.storage.from('car-images').getPublicUrl(path)
      setImages(prev => [...prev, publicUrl])
    }
    setUploading(false)
  }

  async function removeImage(url) {
    const path = pathFromUrl(url)
    if (path) await supabase.storage.from('car-images').remove([path])
    setImages(prev => prev.filter(u => u !== url))
  }

  function onDragStart(idx) { setDraggingIdx(idx) }
  function onDragOver(e, idx) {
    e.preventDefault()
    if (draggingIdx === null || draggingIdx === idx) return
    setImages(prev => {
      const next = [...prev]
      const [moved] = next.splice(draggingIdx, 1)
      next.splice(idx, 0, moved)
      setDraggingIdx(idx)
      return next
    })
  }
  function onDragEnd() { setDraggingIdx(null) }

  async function onSubmit(data) {
    const payload = {
      modelo: data.modelo,
      marca: data.marca,
      año: Number(data.año),
      precio: Number(data.precio),
      kilometraje: Number(data.kilometraje),
      motor: data.motor || null,
      transmision: data.transmision,
      combustible: data.combustible,
      color: data.color || null,
      puertas: data.puertas ? Number(data.puertas) : null,
      traccion: data.traccion || null,
      aire: data.aire === 'true',
      infoentretenimiento: data.infoentretenimiento || null,
      descripcion: data.descripcion || null,
      status: data.status,
      visible: data.visible === true || data.visible === 'true',
      imagenes: images,
    }

    const { error } = isEdit
      ? await supabase.from('cars').update(payload).eq('id', car.id)
      : await supabase.from('cars').insert([payload])

    if (error) {
      toast.error('Error al guardar el auto')
      return
    }
    toast.success(isEdit ? 'Auto actualizado' : 'Auto agregado')
    onSaved()
    onClose()
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  const labelClass = "block text-xs font-medium text-gray-600 mb-1"

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">{isEdit ? 'Editar auto' : 'Agregar auto'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Marca *</label><input {...register('marca', { required: true })} className={inputClass} /></div>
            <div><label className={labelClass}>Modelo *</label><input {...register('modelo', { required: true })} className={inputClass} /></div>
            <div><label className={labelClass}>Año *</label><input type="number" {...register('año', { required: true })} className={inputClass} /></div>
            <div><label className={labelClass}>Precio (MXN) *</label><input type="number" step="0.01" {...register('precio', { required: true })} className={inputClass} /></div>
            <div><label className={labelClass}>Kilometraje *</label><input type="number" {...register('kilometraje', { required: true })} className={inputClass} /></div>
            <div><label className={labelClass}>Motor</label><input {...register('motor')} className={inputClass} placeholder="e.g. 1.6L Turbo" /></div>
            <div>
              <label className={labelClass}>Transmisión *</label>
              <select {...register('transmision', { required: true })} className={inputClass}>
                {TRANSMISIONES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Combustible *</label>
              <select {...register('combustible', { required: true })} className={inputClass}>
                {COMBUSTIBLES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className={labelClass}>Color</label><input {...register('color')} className={inputClass} /></div>
            <div><label className={labelClass}>Puertas</label><input type="number" {...register('puertas')} className={inputClass} /></div>
            <div><label className={labelClass}>Tracción</label><input {...register('traccion')} className={inputClass} placeholder="4x2 / 4x4" /></div>
            <div>
              <label className={labelClass}>Aire acondicionado</label>
              <select {...register('aire')} className={inputClass}>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>

          <div><label className={labelClass}>Info y entretenimiento</label><input {...register('infoentretenimiento')} className={inputClass} /></div>
          <div><label className={labelClass}>Descripción</label><textarea rows={3} {...register('descripcion')} className={inputClass} /></div>

          {/* Status and visibility */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Estado</label>
              <select {...register('status')} className={inputClass}>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Visible en el sitio</label>
              <select {...register('visible')} className={inputClass}>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>

          {/* Images */}
          <div>
            <label className={labelClass}>Imágenes (máx. 10 · JPEG/PNG/WebP · 5MB c/u)</label>
            <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleImageFiles} className="text-sm text-gray-500" />
            {uploading && <p className="text-xs text-blue-500 mt-1">Subiendo imágenes...</p>}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {images.map((url, i) => (
                  <div key={url} draggable onDragStart={() => onDragStart(i)} onDragOver={e => onDragOver(e, i)} onDragEnd={onDragEnd}
                    className="relative cursor-grab group">
                    <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                    <button type="button" onClick={() => removeImage(url)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      ×
                    </button>
                    {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-blue-600/70 text-white text-[9px] text-center rounded-b-lg">Principal</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting || uploading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold transition disabled:opacity-60">
              {isSubmitting ? 'Guardando...' : (isEdit ? 'Guardar cambios' : 'Agregar auto')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
