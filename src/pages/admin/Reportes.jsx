import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '../../lib/supabase'

function formatPrice(p) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(p)
}

function downloadCSV(filename, headers, rows) {
  const BOM = '\uFEFF'
  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))]
  const blob = new Blob([BOM + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function addPDFHeader(doc, title) {
  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text('AutoKlic', 14, 18)
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  doc.text(title, 14, 26)
  doc.setFontSize(9)
  doc.setTextColor(150)
  doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 32)
  doc.setTextColor(0)
  return 38
}

const STATUS_LABELS = { available: 'Disponible', sold: 'Vendido', reserved: 'Reservado', pending: 'Nuevo', reviewing: 'En revisión', offer_made: 'Oferta enviada', closed: 'Cerrado' }

export default function Reportes() {
  const [cars, setCars] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    Promise.all([
      supabase.from('cars').select('*').order('created_at', { ascending: false }),
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
    ]).then(([{ data: c }, { data: l }]) => {
      setCars(c ?? [])
      setLeads(l ?? [])
      setLoading(false)
    })
  }, [])

  function filterByDate(items) {
    return items.filter(item => {
      const d = new Date(item.created_at)
      if (dateFrom && d < new Date(dateFrom)) return false
      if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false
      return true
    })
  }

  const filteredCars = filterByDate(cars)
  const soldCars = cars.filter(c => c.status === 'sold')
  const filteredSold = filterByDate(soldCars)
  const filteredLeads = filterByDate(leads)
  const activeLeads = leads.filter(l => ['pending', 'reviewing'].includes(l.status))
  const revenue = soldCars.reduce((sum, c) => sum + Number(c.precio), 0)

  // PDF exports
  function exportInventarioPDF() {
    const doc = new jsPDF()
    const startY = addPDFHeader(doc, 'Inventario de Autos')
    autoTable(doc, {
      startY,
      head: [['Marca', 'Modelo', 'Año', 'Precio', 'Km', 'Estado', 'Visible']],
      body: filteredCars.map(c => [c.marca, c.modelo, c.año, formatPrice(c.precio), c.kilometraje?.toLocaleString(), STATUS_LABELS[c.status], c.visible ? 'Sí' : 'No']),
    })
    doc.save(`inventario-${format(new Date(), 'yyyyMMdd')}.pdf`)
  }

  function exportVentasPDF() {
    const doc = new jsPDF()
    const startY = addPDFHeader(doc, 'Reporte de Ventas')
    const byMonth = {}
    filteredSold.forEach(c => {
      const key = format(parseISO(c.created_at), 'MMMM yyyy', { locale: es })
      if (!byMonth[key]) byMonth[key] = []
      byMonth[key].push(c)
    })
    const body = []
    for (const [month, items] of Object.entries(byMonth)) {
      body.push([{ content: month, colSpan: 5, styles: { fontStyle: 'bold', fillColor: [230, 240, 255] } }])
      items.forEach(c => body.push([c.marca, c.modelo, c.año, formatPrice(c.precio), format(parseISO(c.created_at), 'dd/MM/yyyy')]))
    }
    if (body.length === 0) body.push([{ content: 'Sin ventas en el período', colSpan: 5, styles: { halign: 'center' } }])
    autoTable(doc, { startY, head: [['Marca', 'Modelo', 'Año', 'Precio', 'Fecha']], body })
    doc.save(`ventas-${format(new Date(), 'yyyyMMdd')}.pdf`)
  }

  function exportLeadsPDF() {
    const doc = new jsPDF()
    const startY = addPDFHeader(doc, 'Pipeline de Leads')
    autoTable(doc, {
      startY,
      head: [['Folio', 'Nombre', 'Auto', 'Email', 'Teléfono', 'Estado', 'Fecha']],
      body: filteredLeads.map(l => [
        l.id.substring(0, 8).toUpperCase(),
        l.nombre, `${l.marca} ${l.modelo} ${l.año}`, l.email, l.telefono,
        STATUS_LABELS[l.status],
        format(parseISO(l.created_at), 'dd/MM/yyyy'),
      ]),
    })
    doc.save(`leads-${format(new Date(), 'yyyyMMdd')}.pdf`)
  }

  // CSV exports
  function exportInventarioCSV() {
    const headers = ['Marca', 'Modelo', 'Año', 'Precio', 'Kilometraje', 'Transmisión', 'Combustible', 'Color', 'Estado', 'Visible', 'Fecha']
    const rows = filteredCars.map(c => [c.marca, c.modelo, c.año, c.precio, c.kilometraje, c.transmision, c.combustible, c.color, STATUS_LABELS[c.status], c.visible ? 'Sí' : 'No', format(parseISO(c.created_at), 'dd/MM/yyyy')])
    downloadCSV(`inventario-${format(new Date(), 'yyyyMMdd')}.csv`, headers, rows)
  }

  function exportVentasCSV() {
    const headers = ['Marca', 'Modelo', 'Año', 'Precio', 'Kilometraje', 'Fecha']
    const rows = filteredSold.map(c => [c.marca, c.modelo, c.año, c.precio, c.kilometraje, format(parseISO(c.created_at), 'dd/MM/yyyy')])
    downloadCSV(`ventas-${format(new Date(), 'yyyyMMdd')}.csv`, headers, rows)
  }

  function exportLeadsCSV() {
    const headers = ['Folio', 'Nombre', 'Email', 'Teléfono', 'Marca', 'Modelo', 'Año', 'Km', 'Estado', 'Fecha']
    const rows = filteredLeads.map(l => [l.id.substring(0, 8).toUpperCase(), l.nombre, l.email, l.telefono, l.marca, l.modelo, l.año, l.kilometraje, STATUS_LABELS[l.status], format(parseISO(l.created_at), 'dd/MM/yyyy')])
    downloadCSV(`leads-${format(new Date(), 'yyyyMMdd')}.csv`, headers, rows)
  }

  const summaryCards = [
    { label: 'Autos en inventario', value: cars.length },
    { label: 'Autos vendidos', value: soldCars.length },
    { label: 'Leads activos', value: activeLeads.length },
    { label: 'Ingresos estimados', value: formatPrice(revenue) },
  ]

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Reportes</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryCards.map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900">{loading ? '—' : card.value}</p>
          </div>
        ))}
      </div>

      {/* Date range */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <label className="text-sm text-gray-600 font-medium">Período:</label>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <span className="text-gray-400 text-sm">—</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(''); setDateTo('') }} className="text-sm text-blue-600 hover:underline">Limpiar</button>
        )}
      </div>

      {/* Export buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Inventario', subtitle: `${filteredCars.length} autos`, onPDF: exportInventarioPDF, onCSV: exportInventarioCSV },
          { title: 'Ventas', subtitle: `${filteredSold.length} vendidos`, onPDF: exportVentasPDF, onCSV: exportVentasCSV },
          { title: 'Leads', subtitle: `${filteredLeads.length} registros`, onPDF: exportLeadsPDF, onCSV: exportLeadsCSV },
        ].map(({ title, subtitle, onPDF, onCSV }) => (
          <div key={title} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="font-semibold text-gray-900">{title}</p>
            <p className="text-xs text-gray-400 mb-4">{subtitle}</p>
            <div className="flex gap-2">
              <button onClick={onPDF} disabled={loading}
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold py-2 rounded-lg transition disabled:opacity-50">
                PDF
              </button>
              <button onClick={onCSV} disabled={loading}
                className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold py-2 rounded-lg transition disabled:opacity-50">
                CSV
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
