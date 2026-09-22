/**
 * Public site URL for SEO canonical / Open Graph.
 * Override at build time with VITE_SITE_URL if needed.
 */
export const SITE_NAME = 'AutoKlic'
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://autoclik.michel-encarnacion.dev').replace(/\/$/, '')
