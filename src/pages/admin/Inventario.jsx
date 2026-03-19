import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import CarModal from '../../components/admin/CarModal'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

const STATUS_LABELS = { available: 'Disponible', sold: 'Vendido', reserved: 'Reservado' }
const STATUS_COLORS = {
  available: 'bg-green-100 text-green-700',
  sold: 'bg-gray-100 text-gray-500',
  reserved: 'bg-yellow-100 text-yellow-700',
}

function formatPrice(price) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(price)
}

export default function Inventario() {
  const { profile } = useAuth()
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'add' | car object
  const [deleteId, setDeleteId] = useState(null)

  const canEdit = profile?.role === 'admin' || profile?.role === 'seller'
  const canDelete = profile?.role === 'admin'

  async function loadCars() {
    const { data } = await supabase.from('cars').select('*').order('created_at', { ascending: false })
    setCars(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadCars() }, [])

  async function toggleVisible(car) {
    const prev = car.visible
    setCars(c => c.map(x => x.id === car.id ? { ...x, visible: !prev } : x))
    const { error } = await supabase.from('cars').update({ visible: !prev }).eq('id', car.id)
    if (error) {
      setCars(c => c.map(x => x.id === car.id ? { ...x, visible: prev } : x))
      toast.error('Error al actualizar visibilidad')
    } else {
      toast.success(prev ? 'Auto ocultado del sitio' : 'Auto visible en el sitio')
    }
  }

  async function confirmDelete() {
    const { error } = await supabase.from('cars').delete().eq('id', deleteId)
    if (error) toast.error('Error al eliminar')
    else { toast.success('Auto eliminado'); setCars(c => c.filter(x => x.id !== deleteId)) }
    setDeleteId(null)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Inventario</h1>
        {canEdit && (
          <button onClick={() => setModal('add')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
            <PlusIcon className="w-4 h-4" /> Agregar auto
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Auto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Año</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Visible</th>
                {canEdit && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cars.map(car => (
                <tr key={car.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 flex items-center gap-3">
                    {car.imagenes?.[0]
                      ? <img src={car.imagenes[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      : <div className="w-12 h-12 rounded-lg bg-gray-100" />
                    }
                    <div>
                      <p className="font-medium text-gray-900">{car.modelo}</p>
                      <p className="text-xs text-gray-400">{car.marca}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{car.año}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{formatPrice(car.precio)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[car.status]}`}>
                      {STATUS_LABELS[car.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {canEdit ? (
                      <button onClick={() => toggleVisible(car)}
                        className={`relative w-10 h-5 rounded-full transition ${car.visible ? 'bg-blue-600' : 'bg-gray-200'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${car.visible ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    ) : (
                      <span className={`text-xs ${car.visible ? 'text-green-600' : 'text-gray-400'}`}>{car.visible ? 'Sí' : 'No'}</span>
                    )}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setModal(car)} className="p-1.5 text-gray-400 hover:text-blue-600 transition">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        {canDelete && (
                          <button onClick={() => setDeleteId(car.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {cars.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No hay autos en el inventario</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CarModal */}
      {modal && (
        <CarModal
          car={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={loadCars}
        />
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-gray-900 mb-2">¿Eliminar auto?</h3>
            <p className="text-sm text-gray-500 mb-4">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-semibold transition">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
