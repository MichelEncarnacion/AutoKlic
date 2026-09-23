/** Canonical public contact (es-MX). Keep Footer / FAB / forms in sync. */
export const CONTACT = {
  phoneDisplay: '+52 221 341 1834',
  phoneTel: '+522213411834',
  whatsappE164: '522213411834',
  email: 'contacto@autoklic.mx',
  addressShort: 'Blvd. Atlixco 2305, Puebla, Pue.',
  addressMaps:
    'https://maps.google.com/?q=Blvd+Atlixco+2305+Puebla',
}

export function whatsappUrl(text) {
  const q = text ? `?text=${encodeURIComponent(text)}` : ''
  return `https://wa.me/${CONTACT.whatsappE164}${q}`
}
