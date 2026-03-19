// src/pages/admin/Ayuda.jsx
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  ArchiveBoxIcon,
  UserGroupIcon,
  ChartBarIcon,
  UsersIcon,
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  KeyIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

const ROLES = ['admin', 'seller', 'viewer']
const ROLE_LABELS = { admin: 'Administrador', seller: 'Vendedor', viewer: 'Visor' }
const ROLE_COLORS = {
  admin:  'bg-red-100 text-red-700 border-red-200',
  seller: 'bg-blue-100 text-blue-700 border-blue-200',
  viewer: 'bg-gray-100 text-gray-600 border-gray-200',
}
const ROLE_ACTIVE = {
  admin:  'bg-red-600 text-white',
  seller: 'bg-blue-600 text-white',
  viewer: 'bg-gray-700 text-white',
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-gray-600" />
        </div>
        <h3 className="font-heading text-lg font-bold text-gray-900">{title}</h3>
      </div>
      <div className="pl-11">{children}</div>
    </div>
  )
}

function Step({ number, text }) {
  return (
    <div className="flex items-start gap-3 mb-2.5">
      <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {number}
      </span>
      <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
    </div>
  )
}

function Tip({ text }) {
  return (
    <div className="flex items-start gap-2 mt-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
      <CheckCircleIcon className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
      <p className="text-xs text-amber-800 leading-relaxed">{text}</p>
    </div>
  )
}

function Badge({ label, color }) {
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      {label}
    </span>
  )
}

// ─── Role content ────────────────────────────────────────────────────────────

function AdminGuide() {
  return (
    <div>
      <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 mb-8">
        <p className="text-sm font-semibold text-red-800 mb-1">Rol: Administrador</p>
        <p className="text-xs text-red-600">
          Tienes acceso completo a todas las secciones: Inventario, Leads, Reportes y Usuarios.
          Puedes crear, editar y eliminar cualquier registro.
        </p>
      </div>

      <Section icon={ArchiveBoxIcon} title="Inventario">
        <p className="text-sm text-gray-500 mb-4">Gestiona todos los vehículos en venta.</p>

        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Agregar un auto</p>
        <Step number="1" text='Haz clic en el botón "+ Agregar auto" en la esquina superior derecha.' />
        <Step number="2" text="Completa los campos: Marca, Modelo, Año, Precio, Kilometraje, Transmisión, Combustible, Color y Puertas." />
        <Step number="3" text='Sube las imágenes del vehículo. Puedes arrastrarlas para cambiar su orden. La primera imagen será la portada.' />
        <Step number="4" text='Marca "Visible en catálogo" si quieres que aparezca en la página pública. Desmárcalo para mantenerlo como borrador.' />
        <Step number="5" text='Haz clic en "Guardar" para publicar.' />
        <Tip text="Las imágenes se almacenan en Supabase Storage. Recomendamos subir al menos 3 fotos por vehículo (frente, lateral y interior)." />

        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-5">Editar o eliminar</p>
        <Step number="1" text="En la tabla de inventario, haz clic en el ícono de lápiz (✏️) para editar un auto." />
        <Step number="2" text="Para eliminar, haz clic en el ícono de basura (🗑️). Se pedirá confirmación antes de borrar." />
        <Step number="3" text='Para ocultar temporalmente un auto sin eliminarlo, usa el toggle de "Visible".' />
      </Section>

      <Section icon={UserGroupIcon} title="Leads">
        <p className="text-sm text-gray-500 mb-4">Gestiona las solicitudes de clientes que quieren vender su auto.</p>
        <Step number="1" text='En la tabla de Leads verás todas las solicitudes con: nombre, contacto, auto, kilometraje y descripción.' />
        <Step number="2" text="Haz clic en una fila para expandirla y ver todos los detalles de la solicitud." />
        <Step number="3" text='Cambia el estado del lead (Nuevo → En proceso → Cerrado) usando el selector de la columna "Estado".' />
        <Step number="4" text="Usa los filtros en la parte superior para buscar por estado o fecha." />
        <Tip text="Contacta al cliente lo antes posible. Los leads sin respuesta en más de 24 horas tienen menor tasa de conversión." />
      </Section>

      <Section icon={ChartBarIcon} title="Reportes">
        <p className="text-sm text-gray-500 mb-4">Analiza el rendimiento del negocio y exporta datos.</p>
        <Step number="1" text="Selecciona un rango de fechas con los campos de inicio y fin." />
        <Step number="2" text="Los 4 indicadores principales (KPIs) se actualizan automáticamente: autos en inventario, leads recibidos, leads cerrados y tasa de conversión." />
        <Step number="3" text='Usa los botones de exportación para descargar los datos. Tienes 6 opciones: PDF y CSV para Inventario, Leads y Reportes combinados.' />
        <Tip text='El PDF de Reportes incluye los KPIs y un resumen ejecutivo. Ideal para presentar al equipo.' />
      </Section>

      <Section icon={UsersIcon} title="Usuarios">
        <p className="text-sm text-gray-500 mb-4">Crea y administra las cuentas del panel.</p>

        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Crear un usuario</p>
        <Step number="1" text='Haz clic en "Crear usuario" en la esquina superior derecha.' />
        <Step number="2" text="Ingresa el nombre completo, correo electrónico y una contraseña temporal (mínimo 6 caracteres)." />
        <Step number="3" text="Asigna el rol según los permisos que necesita (ver tabla abajo)." />
        <Step number="4" text='Haz clic en "Crear usuario". El usuario podrá iniciar sesión de inmediato.' />
        <Tip text="Comparte las credenciales de forma segura. El usuario puede cambiar su contraseña desde el panel." />

        <div className="mt-4 bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Rol</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Inventario</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Leads</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Reportes</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Usuarios</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { role: 'admin',  inv: 'Total', leads: 'Total', rep: 'Total', usr: 'Total' },
                { role: 'seller', inv: 'Crear / Editar', leads: 'Ver / Gestionar', rep: 'Ver', usr: '—' },
                { role: 'viewer', inv: 'Solo lectura', leads: 'Solo lectura', rep: 'Ver', usr: '—' },
              ].map(row => (
                <tr key={row.role}>
                  <td className="px-4 py-2.5">
                    <Badge label={ROLE_LABELS[row.role]} color={ROLE_COLORS[row.role]} />
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{row.inv}</td>
                  <td className="px-4 py-2.5 text-gray-600">{row.leads}</td>
                  <td className="px-4 py-2.5 text-gray-600">{row.rep}</td>
                  <td className="px-4 py-2.5 text-gray-600">{row.usr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-5">Cambiar rol o restablecer contraseña</p>
        <Step number="1" text="En la tabla de usuarios, usa el selector de la columna Rol para cambiar el rol al instante." />
        <Step number="2" text='Haz clic en "Restablecer contraseña" para enviar un correo al usuario con un enlace de cambio.' />
      </Section>
    </div>
  )
}

function SellerGuide() {
  return (
    <div>
      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 mb-8">
        <p className="text-sm font-semibold text-blue-800 mb-1">Rol: Vendedor</p>
        <p className="text-xs text-blue-600">
          Puedes agregar y editar vehículos en el inventario, gestionar leads y ver reportes.
          No tienes acceso a la administración de usuarios.
        </p>
      </div>

      <Section icon={ArchiveBoxIcon} title="Inventario">
        <p className="text-sm text-gray-500 mb-4">Agrega y actualiza los vehículos disponibles para venta.</p>

        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Agregar un auto</p>
        <Step number="1" text='Haz clic en "+ Agregar auto".' />
        <Step number="2" text="Llena todos los campos obligatorios: Marca, Modelo, Año, Precio, Kilometraje." />
        <Step number="3" text="Sube mínimo una imagen. La primera foto es la que verán los clientes en el catálogo." />
        <Step number="4" text='Activa "Visible en catálogo" para que aparezca en la página pública.' />
        <Step number="5" text='Guarda. El auto aparecerá en el catálogo de inmediato.' />
        <Tip text="Agrega siempre una descripción atractiva del vehículo. Los autos con descripción reciben más contactos." />

        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-5">Editar un auto</p>
        <Step number="1" text="Encuentra el auto en la tabla y haz clic en el ícono de lápiz." />
        <Step number="2" text="Modifica los campos necesarios: precio, estado, fotos, etc." />
        <Step number="3" text="Guarda los cambios. Se actualizan al instante en el catálogo." />
        <Tip text='Si un auto fue vendido, cámbialo a estado "Vendido" en lugar de eliminarlo. Así se mantiene el historial.' />
      </Section>

      <Section icon={UserGroupIcon} title="Leads">
        <p className="text-sm text-gray-500 mb-4">Revisa y gestiona las solicitudes de clientes interesados en vender su auto.</p>
        <Step number="1" text="En la sección Leads verás la lista de solicitudes ordenadas por fecha." />
        <Step number="2" text="Haz clic en una fila para ver los detalles completos: datos del cliente, auto, kilometraje y descripción." />
        <Step number="3" text='Cambia el estado del lead: "Nuevo" cuando llega, "En proceso" cuando ya contactaste al cliente, "Cerrado" cuando se finalizó.' />
        <Step number="4" text="Contacta al cliente por teléfono o email usando los datos que aparecen en el detalle." />
        <Tip text="Responde los leads nuevos lo antes posible. Un primer contacto rápido aumenta las probabilidades de cierre." />
      </Section>

      <Section icon={ChartBarIcon} title="Reportes">
        <p className="text-sm text-gray-500 mb-4">Consulta el resumen de actividad del negocio.</p>
        <Step number="1" text="Selecciona el rango de fechas que quieres analizar." />
        <Step number="2" text="Revisa los 4 KPIs: autos activos, leads recibidos, leads cerrados y tasa de conversión." />
        <Step number="3" text="Descarga los reportes en PDF o CSV para compartirlos con el equipo." />
      </Section>
    </div>
  )
}

function ViewerGuide() {
  return (
    <div>
      <div className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 mb-8">
        <p className="text-sm font-semibold text-gray-800 mb-1">Rol: Visor</p>
        <p className="text-xs text-gray-500">
          Tienes acceso de solo lectura. Puedes consultar el inventario, los leads y los reportes,
          pero no puedes crear ni modificar ningún registro.
        </p>
      </div>

      <Section icon={ArchiveBoxIcon} title="Inventario">
        <p className="text-sm text-gray-500 mb-4">Consulta los vehículos registrados en el sistema.</p>
        <Step number="1" text="En la sección Inventario verás todos los autos del catálogo con sus detalles." />
        <Step number="2" text="Puedes ver precios, kilometraje, estado y fotos de cada vehículo." />
        <Step number="3" text="Usa la búsqueda para encontrar un auto específico rápidamente." />
        <Tip text="Si necesitas agregar o editar un vehículo, contacta a un Vendedor o Administrador." />
      </Section>

      <Section icon={UserGroupIcon} title="Leads">
        <p className="text-sm text-gray-500 mb-4">Consulta las solicitudes de clientes registradas.</p>
        <Step number="1" text="En la sección Leads podrás ver todas las solicitudes recibidas." />
        <Step number="2" text="Haz clic en una fila para ver los detalles del cliente y del auto." />
        <Step number="3" text="Puedes filtrar por estado (Nuevo, En proceso, Cerrado) para ver el progreso." />
        <Tip text="Para gestionar o cambiar el estado de un lead, contacta a un Vendedor." />
      </Section>

      <Section icon={ChartBarIcon} title="Reportes">
        <p className="text-sm text-gray-500 mb-4">Consulta el resumen de rendimiento del negocio.</p>
        <Step number="1" text="Selecciona el período de fechas que quieres consultar." />
        <Step number="2" text="Revisa los indicadores: autos activos, leads recibidos, leads cerrados y tasa de conversión." />
        <Step number="3" text="Descarga los reportes en PDF o CSV para análisis externo." />
      </Section>
    </div>
  )
}

const GUIDES = { admin: AdminGuide, seller: SellerGuide, viewer: ViewerGuide }

// ─── Main component ───────────────────────────────────────────────────────────

export default function Ayuda() {
  const { profile } = useAuth()
  const defaultTab = profile?.role ?? 'admin'
  const [activeTab, setActiveTab] = useState(defaultTab)

  const GuideComponent = GUIDES[activeTab]

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-gray-900 mb-1">
          Manual de usuario
        </h1>
        <p className="text-sm text-gray-400">
          Guía de uso del panel de administración AutoKlic.
        </p>
      </div>

      {/* Role tabs */}
      <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-xl w-fit">
        {ROLES.map(role => (
          <button
            key={role}
            onClick={() => setActiveTab(role)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === role
                ? ROLE_ACTIVE[role]
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {ROLE_LABELS[role]}
          </button>
        ))}
      </div>

      {/* Guide content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <GuideComponent />
      </div>

      {/* Footer note */}
      <p className="text-xs text-gray-400 text-center mt-6">
        ¿Tienes dudas adicionales? Contacta al administrador del sistema.
      </p>
    </div>
  )
}
