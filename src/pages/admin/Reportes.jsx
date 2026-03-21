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

// ─── PDF shared utilities ─────────────────────────────────────────────────────

const BRAND_RED  = [220, 38, 38]   // red-600
const HEADER_RED = [153, 27, 27]   // red-800 (table head)
const GRAY_50    = [249, 250, 251]
const GRAY_200   = [229, 231, 235]
const GRAY_800   = [31, 41, 55]

// Status badge fill colors [r, g, b] — keys must match STATUS_LABELS values
const STATUS_FILL = {
  Disponible:        [220, 252, 231],  // green-100
  Vendido:           [243, 244, 246],  // gray-100
  Reservado:         [254, 249, 195],  // yellow-100
  Nuevo:             [219, 234, 254],  // blue-100
  'En revisión':     [254, 243, 199],  // amber-100
  'Oferta enviada':  [243, 232, 255],  // purple-100
  Cerrado:           [243, 244, 246],  // gray-100
}

const TABLE_STYLES = {
  headStyles: {
    fillColor: HEADER_RED,
    textColor: [255, 255, 255],
    fontStyle: 'bold',
    fontSize: 8,
  },
  alternateRowStyles: { fillColor: GRAY_50 },
  bodyStyles: { fontSize: 8, textColor: GRAY_800 },
  styles: {
    cellPadding: 3,
    lineColor: GRAY_200,
    lineWidth: 0.1,
  },
}

/**
 * Draws the branded header banner and returns the Y position where content starts.
 * Uses dynamic page width so it works for both portrait and landscape.
 */
function addPDFHeader(doc, title, period = '') {
  const w = doc.internal.pageSize.getWidth()

  // Red banner
  doc.setFillColor(...BRAND_RED)
  doc.rect(0, 0, w, 26, 'F')

  // Brand name
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text('AutoKlic', 14, 11)

  // Report title
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.text(title, 14, 20)

  // Generated date — right-aligned in banner
  doc.setFontSize(8)
  doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, w - 14, 20, { align: 'right' })

  doc.setTextColor(0, 0, 0)

  if (period) {
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text(`Período: ${period}`, 14, 34)
    doc.setTextColor(0, 0, 0)
    return 40
  }
  return 32
}

/**
 * Adds page-number footers to every page. Call AFTER all autoTable calls.
 * Uses dynamic page dimensions so it works for portrait and landscape.
 */
function addPDFFooters(doc, reportTitle) {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const w = doc.internal.pageSize.getWidth()
    const h = doc.internal.pageSize.getHeight()
    doc.setDrawColor(...GRAY_200)
    doc.line(14, h - 12, w - 14, h - 12)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(reportTitle, 14, h - 7)
    doc.text(`Página ${i} de ${pageCount}`, w - 14, h - 7, { align: 'right' })
    doc.setTextColor(0, 0, 0)
  }
}

/**
 * Returns a human-readable period string for the report header.
 */
function buildPeriodString(from, to) {
  if (!from && !to) return 'Todo el período'
  if (from && to) return `${format(new Date(from), 'dd/MM/yyyy')} — ${format(new Date(to), 'dd/MM/yyyy')}`
  if (from) return `Desde ${format(new Date(from), 'dd/MM/yyyy')}`
  return `Hasta ${format(new Date(to), 'dd/MM/yyyy')}`
}

/**
 * Returns a jspdf-autotable didParseCell hook that colors cells in the status column.
 * @param {number} statusColIndex - 0-based column index of the status column
 */
function makeStatusHook(statusColIndex) {
  return (data) => {
    if (data.section === 'body' && data.column.index === statusColIndex) {
      const fill = STATUS_FILL[data.cell.raw]
      if (fill) {
        data.cell.styles.fillColor = fill
        data.cell.styles.textColor = GRAY_800
      }
    }
  }
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
    const period = buildPeriodString(dateFrom, dateTo)
    const startY = addPDFHeader(doc, 'Inventario de Autos', period)

    autoTable(doc, {
      startY,
      head: [['Marca', 'Modelo', 'Año', 'Precio', 'Km', 'Estado', 'Visible']],
      body: filteredCars.map(c => [
        c.marca ?? '—',
        c.modelo ?? '—',
        c.año ?? '—',
        formatPrice(c.precio),
        c.kilometraje?.toLocaleString('es-MX') ?? '—',
        STATUS_LABELS[c.status] ?? c.status,
        c.visible ? 'Sí' : 'No',
      ]),
      columnStyles: {
        0: { cellWidth: 30 }, // Marca
        1: { cellWidth: 36 }, // Modelo
        2: { cellWidth: 14 }, // Año
        3: { cellWidth: 32 }, // Precio
        4: { cellWidth: 24 }, // Km
        5: { cellWidth: 32 }, // Estado
        6: { cellWidth: 14 }, // Visible
      },
      didParseCell: makeStatusHook(5),
      ...TABLE_STYLES,
    })

    addPDFFooters(doc, 'Inventario de Autos')
    doc.save(`inventario-${format(new Date(), 'yyyyMMdd')}.pdf`)
  }

  function exportVentasPDF() {
    const doc = new jsPDF()
    const period = buildPeriodString(dateFrom, dateTo)
    let y = addPDFHeader(doc, 'Reporte de Ventas', period)

    // ── KPI summary boxes ─────────────────────────────────────────────────────
    const totalRevenue = filteredSold.reduce((sum, c) => sum + Number(c.precio ?? 0), 0)
    const avgPrice     = filteredSold.length > 0 ? totalRevenue / filteredSold.length : 0

    const byMonthCount = {}
    filteredSold.forEach(c => {
      const key = format(parseISO(c.created_at ?? new Date().toISOString()), 'MMMM yyyy', { locale: es })
      byMonthCount[key] = (byMonthCount[key] ?? 0) + 1
    })
    const bestMonth = Object.entries(byMonthCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

    const kpis = [
      { label: 'Autos vendidos',  value: String(filteredSold.length) },
      { label: 'Ingreso total',   value: formatPrice(totalRevenue) },
      { label: 'Precio promedio', value: formatPrice(avgPrice) },
      { label: 'Mejor mes',       value: bestMonth },
    ]

    // 4 KPI boxes — each 43mm wide with 3mm gap, starting at x=14
    const boxW = 43, boxH = 22, gap = 3, startX = 14
    kpis.forEach((kpi, i) => {
      const x = startX + i * (boxW + gap)
      doc.setFillColor(...GRAY_50)
      doc.setDrawColor(...GRAY_200)
      doc.roundedRect(x, y, boxW, boxH, 2, 2, 'FD')
      doc.setFontSize(7)
      doc.setTextColor(100, 100, 100)
      doc.text(kpi.label, x + boxW / 2, y + 7, { align: 'center' })
      doc.setFontSize(10)
      doc.setFont(undefined, 'bold')
      doc.setTextColor(...GRAY_800)
      doc.text(kpi.value, x + boxW / 2, y + 16, { align: 'center' })
      doc.setFont(undefined, 'normal')
    })

    y += boxH + 8

    // ── Monthly breakdown table ───────────────────────────────────────────────
    const byMonth = {}
    filteredSold.forEach(c => {
      const key = format(parseISO(c.created_at ?? new Date().toISOString()), 'MMMM yyyy', { locale: es })
      if (!byMonth[key]) byMonth[key] = []
      byMonth[key].push(c)
    })

    const body = []
    for (const [month, items] of Object.entries(byMonth)) {
      body.push([{
        content: `${month}  (${items.length} auto${items.length !== 1 ? 's' : ''})`,
        colSpan: 5,
        styles: { fontStyle: 'bold', fillColor: [254, 226, 226], textColor: [153, 27, 27] },
      }])
      items.forEach(c => body.push([
        c.marca ?? '—',
        c.modelo ?? '—',
        c.año ?? '—',
        formatPrice(c.precio),
        format(parseISO(c.created_at ?? new Date().toISOString()), 'dd/MM/yyyy'),
      ]))
    }

    if (body.length === 0) {
      body.push([{
        content: 'Sin ventas en el período seleccionado',
        colSpan: 5,
        styles: { halign: 'center', textColor: [150, 150, 150] },
      }])
    }

    autoTable(doc, {
      startY: y,
      head: [['Marca', 'Modelo', 'Año', 'Precio', 'Fecha']],
      body,
      columnStyles: {
        0: { cellWidth: 36 }, // Marca
        1: { cellWidth: 48 }, // Modelo
        2: { cellWidth: 16 }, // Año
        3: { cellWidth: 54 }, // Precio
        4: { cellWidth: 28 }, // Fecha
      },
      ...TABLE_STYLES,
    })

    addPDFFooters(doc, 'Reporte de Ventas')
    doc.save(`ventas-${format(new Date(), 'yyyyMMdd')}.pdf`)
  }

  function exportLeadsPDF() {
    const doc = new jsPDF({ orientation: 'landscape' })
    const period = buildPeriodString(dateFrom, dateTo)
    const startY = addPDFHeader(doc, 'Pipeline de Leads', period)

    autoTable(doc, {
      startY,
      head: [['Folio', 'Nombre', 'Auto', 'Email', 'Teléfono', 'Estado', 'Fecha']],
      body: filteredLeads.map(l => [
        (l.id ?? '').substring(0, 8).toUpperCase(),
        l.nombre ?? '—',
        [l.marca, l.modelo, l.año].filter(Boolean).join(' ') || '—',
        l.email ?? '—',
        l.telefono ?? '—',
        STATUS_LABELS[l.status] ?? l.status,
        format(parseISO(l.created_at ?? new Date().toISOString()), 'dd/MM/yyyy'),
      ]),
      columnStyles: {
        0: { cellWidth: 22 },  // Folio
        1: { cellWidth: 40 },  // Nombre
        2: { cellWidth: 50 },  // Auto
        3: { cellWidth: 60 },  // Email
        4: { cellWidth: 32 },  // Teléfono
        5: { cellWidth: 35 },  // Estado
        6: { cellWidth: 30 },  // Fecha
      },
      didParseCell: makeStatusHook(5),
      ...TABLE_STYLES,
    })

    addPDFFooters(doc, 'Pipeline de Leads')
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
