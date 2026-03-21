import { format } from 'date-fns'

// ─── Colours ──────────────────────────────────────────────────────────────────
export const BRAND_RED  = [220, 38, 38]
export const HEADER_RED = [153, 27, 27]
export const GRAY_50    = [249, 250, 251]
export const GRAY_200   = [229, 231, 235]
export const GRAY_800   = [31, 41, 55]

export const STATUS_FILL = {
  Disponible:        [220, 252, 231],
  Vendido:           [243, 244, 246],
  Reservado:         [254, 249, 195],
  Nuevo:             [219, 234, 254],
  'En revisión':     [254, 243, 199],
  'Oferta enviada':  [243, 232, 255],
  Cerrado:           [243, 244, 246],
}

export const TABLE_STYLES = {
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
 * Works for both portrait and landscape — uses doc.internal.pageSize.getWidth().
 */
export function addPDFHeader(doc, title, period = '') {
  const w = doc.internal.pageSize.getWidth()
  doc.setFillColor(...BRAND_RED)
  doc.rect(0, 0, w, 26, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text('AutoKlic', 14, 11)
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.text(title, 14, 20)
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
 */
export function addPDFFooters(doc, reportTitle) {
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
export function buildPeriodString(from, to) {
  if (!from && !to) return 'Todo el período'
  if (from && to) return `${format(new Date(from), 'dd/MM/yyyy')} — ${format(new Date(to), 'dd/MM/yyyy')}`
  if (from) return `Desde ${format(new Date(from), 'dd/MM/yyyy')}`
  return `Hasta ${format(new Date(to), 'dd/MM/yyyy')}`
}

/**
 * Returns a jspdf-autotable didParseCell hook that colours cells in the status column.
 * @param {number} statusColIndex - 0-based column index of the status column
 */
export function makeStatusHook(statusColIndex) {
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
