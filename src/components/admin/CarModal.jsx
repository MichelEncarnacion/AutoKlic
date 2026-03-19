// src/components/admin/CarModal.jsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline'

const TRANSMISIONES = ['Manual', 'Automática']
const COMBUSTIBLES  = ['Gasolina', 'Diésel', 'Híbrido', 'Eléctrico']
const STATUSES = [
  { value: 'available', label: 'Disponible' },
  { value: 'sold',      label: 'Vendido'    },
  { value: 'reserved',  label: 'Reservado'  },
]

export default function CarModal({ car, onClose, onSaved }) {
  const isEdit = Boolean(car)
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: car
      ? { ...car, aire: car.aire ? 'true' : 'false' }
      : { status: 'available', visible: true },
  })

  const [images, setImages]         = useState(car?.imagenes ?? [])
  const [draggingIdx, setDraggingIdx] = useState(null)
  const [uploading, setUploading]   = useState(false)

  function pathFromUrl(url) {
    const marker = '/car-images/'
    const idx = url.indexOf(marker)
    return idx >= 0 ? url.substring(idx + marker.length) : null
  }

  async function handleImageFiles(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
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
      if (error) { toast.error(`Error subiendo ${file.name}`); continue }
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

  // Drag-to-reorder (desktop)
  function onDragStart(idx)      { setDraggingIdx(idx) }
  function onDragEnd()           { setDraggingIdx(null) }
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

  async function onSubmit(data) {
    const payload = {
      modelo:             data.modelo,
      marca:              data.marca,
      año:                Number(data.año),
      precio:             Number(data.precio),
      kilometraje:        Number(data.kilometraje),
      motor:              data.motor || null,
      transmision:        data.transmision,
      combustible:        data.combustible,
      color:              data.color || null,
      puertas:            data.puertas ? Number(data.puertas) : null,
      traccion:           data.traccion || null,
      aire:               data.aire === 'true',
      infoentretenimiento: data.infoentretenimiento || null,
      descripcion:        data.descripcion || null,
      status:             data.status,
      visible:            data.visible === true || data.visible === 'true',
      imagenes:           images,
    }

    const { error } = isEdit
      ? await supabase.from('cars').update(payload).eq('id', car.id)
      : await supabase.from('cars').insert([payload])

    if (error) { toast.error('Error al guardar el auto'); return }
    toast.success(isEdit ? 'Auto actualizado' : 'Auto agregado')
    onSaved()
    onClose()
  }

  const inputClass = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all"
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5"

  return (
    // Full-screen on mobile, centered dialog on desktop
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:rounded-2xl sm:shadow-2xl sm:w-full sm:max-w-2xl max-h-screen sm:max-h-[92vh] flex flex-col rounded-t-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-heading text-lg font-bold text-gray-900">
            {isEdit ? 'Editar auto' : 'Agregar auto'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* ── Images (first on mobile for quick camera access) ── */}
          <div>
            <label className={labelClass}>
              Fotos del vehículo ({images.length}/10)
            </label>

            {/* Upload button — touch-friendly, supports camera on mobile */}
            <label className="flex flex-col items-center gap-2 w-full border-2 border-dashed border-gray-200 rounded-xl p-5 cursor-pointer hover:border-red-300 hover:bg-red-50/30 transition-colors">
              <PhotoIcon className="h-8 w-8 text-gray-300" />
              <span className="text-sm font-medium text-gray-500">
                {uploading ? 'Subiendo...' : 'Toca para seleccionar o fotografiar'}
              </span>
              <span className="text-xs text-gray-400">JPEG · PNG · WebP · máx. 5MB c/u</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageFiles}
                disabled={uploading}
                className="hidden"
              />
            </label>

            {/* Thumbnails */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {images.map((url, i) => (
                  <div
                    key={url}
                    draggable
                    onDragStart={() => onDragStart(i)}
                    onDragOver={e => onDragOver(e, i)}
                    onDragEnd={onDragEnd}
                    className="relative cursor-grab group"
                  >
                    <img src={url} alt="" className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
                    {/* Remove button — always visible on touch devices */}
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition sm:opacity-0 sm:group-hover:opacity-100 opacity-100"
                    >
                      ×
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 bg-red-600/80 text-white text-[9px] text-center rounded-b-xl py-0.5">
                        Principal
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {images.length > 1 && (
              <p className="text-xs text-gray-400 mt-2">
                Arrastra las fotos para cambiar el orden.
              </p>
            )}
          </div>

          {/* ── Basic info ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Marca *</label>
              <input {...register('marca', { required: true })} className={inputClass} placeholder="Toyota" />
            </div>
            <div>
              <label className={labelClass}>Modelo *</label>
              <input {...register('modelo', { required: true })} className={inputClass} placeholder="Corolla" />
            </div>
            <div>
              <label className={labelClass}>Año *</label>
              <input type="number" {...register('año', { required: true })} className={inputClass} placeholder="2022" />
            </div>
            <div>
              <label className={labelClass}>Precio (MXN) *</label>
              <input type="number" step="1" {...register('precio', { required: true })} className={inputClass} placeholder="250000" />
            </div>
            <div>
              <label className={labelClass}>Kilometraje *</label>
              <input type="number" {...register('kilometraje', { required: true })} className={inputClass} placeholder="45000" />
            </div>
            <div>
              <label className={labelClass}>Motor</label>
              <input {...register('motor')} className={inputClass} placeholder="1.6L Turbo" />
            </div>
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
            <div>
              <label className={labelClass}>Color</label>
              <input {...register('color')} className={inputClass} placeholder="Blanco" />
            </div>
            <div>
              <label className={labelClass}>Puertas</label>
              <input type="number" {...register('puertas')} className={inputClass} placeholder="4" />
            </div>
            <div>
              <label className={labelClass}>Tracción</label>
              <input {...register('traccion')} className={inputClass} placeholder="4x2 / 4x4" />
            </div>
            <div>
              <label className={labelClass}>Aire acondicionado</label>
              <select {...register('aire')} className={inputClass}>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Infoentretenimiento</label>
            <input {...register('infoentretenimiento')} className={inputClass} placeholder="Pantalla táctil + Apple CarPlay" />
          </div>

          <div>
            <label className={labelClass}>Descripción</label>
            <textarea rows={3} {...register('descripcion')} className={inputClass} placeholder="Describe el estado y características del vehículo..." />
          </div>

          {/* ── Status & visibility ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Estado</label>
              <select {...register('status')} className={inputClass}>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Visible en el sitio</label>
              <select {...register('visible')} className={inputClass}>
                <option value="true">Sí — aparece en catálogo</option>
                <option value="false">No — solo interno</option>
              </select>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex gap-3 pt-1 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 rounded-xl text-sm font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-60"
            >
              {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Agregar auto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
