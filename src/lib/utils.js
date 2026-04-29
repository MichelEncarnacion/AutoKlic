export function formatPrice(price) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(price ?? 0)
}

export function toSlug(str) {
  return str.toLowerCase().replace(/\s+/g, '-')
}
